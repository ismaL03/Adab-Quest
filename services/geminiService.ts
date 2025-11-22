import { GoogleGenAI } from "@google/genai";

export const sendMessageToMurabbi = async (message: string, history: string[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemPrompt = `Tu es le "Murabbi AI", un coach spirituel et éthique pour une application nommée Adab Quest. 
  Ta cible : Gen Z musulmane.
  Ton ton : Bienveillant, sage, moderne, jamais moralisateur ou culpabilisant ("Haram police").
  Ta mission : Aider l'utilisateur à pratiquer le "Muhasaba" (introspection) et transformer ses défis quotidiens en quêtes spirituelles.
  
  Règles :
  1. Sois concis (max 3-4 phrases).
  2. Utilise des concepts de gamification (XP, Level Up, Boss fight contre l'Ego).
  3. Cite une sagesse universelle ou islamique (Ghazali, Rumi, Hadith doux) si pertinent.
  4. Si l'utilisateur raconte une difficulté, propose une petite action concrète pour demain.
  
  Contexte actuel : L'utilisateur te parle en fin de journée.`;

  try {
    // Combine system prompt with chat history context conceptually
    // In a real app, we would pass the full history array to the model
    const prompt = `${systemPrompt}\n\nHistorique de conversation:\n${history.join('\n')}\n\nUtilisateur: ${message}\n\nMurabbi:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Je médite sur tes paroles... (Erreur de connexion)";
  } catch (error) {
    console.error("Murabbi AI Error:", error);
    return "Ma connexion spirituelle est brouillée. Réessaie plus tard.";
  }
};