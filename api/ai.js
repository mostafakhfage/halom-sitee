export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { prompt, maxTokens, type, face_image_url, scene } = req.body || {};

  // === توليد الصور عبر Fal.ai ===
  if (type === "image") {
    const FAL_KEY = process.env.FAL_API_KEY;
    if (!FAL_KEY) return res.status(500).json({ error: "FAL_API_KEY not set" });

    const scenes = [
      "a romantic couple standing together in outer space surrounded by colorful nebulas and stars, cinematic lighting, ultra realistic",
      "a romantic couple in a magical fantasy castle with rose petals falling, golden light, ultra realistic",
      "a romantic couple in a beautiful garden full of flowers at sunset, warm golden light, ultra realistic",
      "a romantic couple illustrated in anime style, soft colors, beautiful background, detailed",
      "a romantic couple in a cinematic movie scene, dramatic lighting, high quality, ultra realistic",
      "a romantic couple walking on a beach at sunset, golden hour, ultra realistic",
      "a romantic couple under the Eiffel Tower at night with lights, ultra realistic",
      "a romantic couple in a cozy cabin in the snow, warm fireplace light, ultra realistic"
    ];

    const selectedScene = scene !== undefined && scenes[scene] ? scenes[scene] : scenes[Math.floor(Math.random() * scenes.length)];
    const imagePrompt = `${selectedScene}, beautiful faces, high quality, 8k`;

    try {
      // إذا في صورة وجه، نستخدم IP-Adapter
      if (face_image_url) {
        const submitRes = await fetch("https://queue.fal.run/fal-ai/ip-adapter-face-id", {
          method: "POST",
          headers: {
            "Authorization": `Key ${FAL_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            face_image_url: face_image_url,
            num_inference_steps: 30,
            guidance_scale: 7.5
          })
        });
        const submitData = await submitRes.json();
        const requestId = submitData.request_id;

        // انتظر النتيجة
        let result = null;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const statusRes = await fetch(`https://queue.fal.run/fal-ai/ip-adapter-face-id/requests/${requestId}`, {
            headers: { "Authorization": `Key ${FAL_KEY}` }
          });
          const statusData = await statusRes.json();
          if (statusData.status === "COMPLETED") {
            result = statusData;
            break;
          }
        }

        if (result?.images?.[0]?.url) {
          return res.status(200).json({ image_url: result.images[0].url });
        }
        return res.status(500).json({ error: "image generation timeout" });

      } else {
        // بدون صورة وجه - نستخدم flux-schnell
        const submitRes = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: {
            "Authorization": `Key ${FAL_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            num_inference_steps: 4,
            image_size: "landscape_4_3"
          })
        });
        const submitData = await submitRes.json();
        const requestId = submitData.request_id;

        let result = null;
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 1500));
          const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${requestId}`, {
            headers: { "Authorization": `Key ${FAL_KEY}` }
          });
          const statusData = await statusRes.json();
          if (statusData.status === "COMPLETED") {
            result = statusData;
            break;
          }
        }

        if (result?.images?.[0]?.url) {
          return res.status(200).json({ image_url: result.images[0].url });
        }
        return res.status(500).json({ error: "image generation timeout" });
      }
    } catch (e) {
      return res.status(500).json({ error: "fal error: " + e.message });
    }
  }

  // === توليد النصوص عبر Gemini ===
  if (!prompt) {
    return res.status(400).json({ error: "prompt required" });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens || 300,
            temperature: 0.85
          }
        })
      }
    );
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "gemini error" });
  }
}
