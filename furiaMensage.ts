import axios from "axios";

export async function handleIncomingMessage(req: any, res: any) {
  try {
    const entry = req.body.entry?.[0];
    const messageObj = entry?.changes?.[0]?.value?.messages?.[0];

    if (!messageObj || !messageObj.text) {
      return res.sendStatus(200); // Ignora se não for mensagem de texto
    }

    const userMessage = messageObj.text.body;
    const userNumber = messageObj.from;

    const resposta = await validateMessageFunction(userMessage);
    await sendWhatsappMessage(userNumber, resposta);

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.sendStatus(500);
  }
}

async function validateMessageFunction(userMessage: string): Promise<string> {
  const normalized = userMessage.trim().toLowerCase();

  switch (normalized) {
    case "quais são os jogadores atuais da furia de cs?":
      return "Os jogadores de CS da FURIA são: FalleN (IGL), KSCERATO, yuurih, molodoy e YEKINDAR";

    case "quais jogadores de cs da furia já foram top 20?":
      return "Os jogadores da FURIA que já foram top 20 pelo HLTV são: KSCERATO (#18 em 2020, #15 em 2021, #9 em 2022 e #19 em 2023), FalleN (#2 em 2016 e #6 em 2017), yuurih (#14 em 2020 e #19 em 2022) e YEKINDAR (#9 em 2021 e #15 em 2022)";

    case "quais jogadores passaram pelo time de cs mas acabaram saindo?":
      return "chelo (ainda sem time), skullz (ainda sem time), arT (saída para o Fluxo), saffee (saída para o MIBR), drop (saída para o MIBR), VINI (saída para a IMPERIAL), junior (Saida para o COL), honda (saída para a FURIA Academy), HEN1 (saída para O PLANO) e ableJ (saída para o VALORANT)";

    case "quais o títulos da furia no cs?":
      return "A FURIA foi campeã do Elisa Masters Espoo 2023, Elisa Invitational Summer 2021, ESL Pro League Season 12: North America, DreamHack Masters Spring 2020: North America, Arctic Invitational 2019 e EMF CS:GO World Invitational 2019";

    case "qual próximo campeonato que a furia cs vai participar?":
      return "O próximo campeonato da FURIA CS será a PGL Astana 2025";

    default:
      const openaiResponse = await queryOpenAI(userMessage);
      return `O sistema não possui essa informação por default, mas buscando na internet: ${openaiResponse}`;
  }
}

async function sendWhatsappMessage(to: string, message: string) {
  const PHONE_NUMBER_ID = process.env.WPP_PHONE_NUMBER_ID;
  const WPP_TOKEN = process.env.WPP_TOKEN;

  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: { body: message },
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${WPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Mensagem enviada com sucesso", response.data);
  } catch (error: any) {
    console.error("Erro ao enviar mensagem no WhatsApp:", error.response?.data || error.message);
  }
}

async function queryOpenAI(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("Erro ao consultar OpenAI:", err);
    return "Erro ao buscar essa informação online.";
  }
}
