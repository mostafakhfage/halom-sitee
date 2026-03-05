export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { prompt, maxTokens, type, scene } = req.body || {};

  const OR_KEY = process.env.OPENROUTER_API_KEY;

  // === توليد الصور ===
  if (type === "image") {
    // صور رومانسية بملامح مصطفى وحلوم الحقيقية - مولّدة بالذكاء الاصطناعي
    const IMAGE_POOLS = {
      space: [
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/kcYoLFSHoKnJGSCQ.jpg",
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/MbhkXjZGlfBKnLur.jpg",
      ],
      fantasy: [
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/HsvQFpRgNPSTPkIU.jpg",
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/PxmJeJvfTpMShCUI.jpg",
      ],
      anime: [
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/zOSGDFEAHZEdIXTf.jpg",
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/KhUvgnbMfjcnOjuH.jpg",
      ],
      cinematic: [
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/UyLnotTrovvMpvYi.jpg",
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/CoqYdqBmlZlDVffu.jpg",
      ],
      beach: [
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/iyQwKnMySKDfwmbt.jpg",
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/CoqYdqBmlZlDVffu.jpg",
      ],
      winter: [
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/ejebxBHpzvafWdzc.jpg",
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663405308472/kcYoLFSHoKnJGSCQ.jpg",
      ],
    };

    const styleKeys = Object.keys(IMAGE_POOLS);
    const selectedStyle = styleKeys[scene % styleKeys.length] || styleKeys[0];
    const pool = IMAGE_POOLS[selectedStyle];
    const imageUrl = pool[Math.floor(Math.random() * pool.length)];

    return res.status(200).json({ image_url: imageUrl });
  }

  // === توليد النصوص عبر OpenRouter ===
  if (!prompt) {
    return res.status(400).json({ error: "prompt required" });
  }

  if (!OR_KEY) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY not set" });
  }

  // نماذج مجانية نجربها بالترتيب
  const MODELS = [
    "z-ai/glm-4.5-air:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
  ];

  for (const model of MODELS) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OR_KEY}`,
          "HTTP-Referer": "https://halom-sitee.vercel.app",
          "X-Title": "Halom Site"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "أنت مساعد رومانسي شاعري. أجب مباشرة بالعربية بدون مقدمات أو تفسيرات. ردودك جميلة ومؤثرة وعاطفية."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: maxTokens || 300,
          temperature: 0.9,
          reasoning_effort: "none"
        })
      });

      if (!r.ok) {
        if (r.status === 429 || r.status === 404 || r.status === 503) continue;
        continue;
      }

      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content?.trim() || "";
      if (text && text.length > 5) {
        return res.status(200).json({ text });
      }
      continue;

    } catch (e) {
      continue;
    }
  }

  // fallback: Pollinations
  try {
    const polRes = await fetch(
      "https://text.pollinations.ai/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "أنت مساعد رومانسي شاعري. أجب بالعربية مباشرة بدون مقدمات." },
            { role: "user", content: prompt }
          ],
          model: "openai",
          seed: Math.floor(Math.random() * 99999)
        })
      }
    );
    const text = (await polRes.text()).trim();
    if (text && text.length > 5) {
      return res.status(200).json({ text });
    }
  } catch (e) {}

  return res.status(200).json({ text: "" });
}
