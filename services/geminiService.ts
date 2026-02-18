
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSummary = async (patientNotes: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Resuma brevemente a condição clínica e a urgência do paciente com base nestas notas (em Português): ${patientNotes}`,
    });
    return response.text || "Não foi possível gerar um resumo.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao processar resumo inteligente.";
  }
};
