export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { prompt } = req.body || {};

  try {

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: "أجب بالعربية وبشكل منطقي ورومانسي." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await r.json();

    const text =
      data?.choices?.[0]?.message?.content || "لا يوجد رد";

    res.status(200).json({ text });

  } catch (e) {
    res.status(500).json({ error: "server error" });
  }

}
