import { GoogleGenAI, Type } from "@google/genai";
import { Disease, Frequency } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getCandidateDiseases(category: string, initialSymptoms: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are an expert in rare diseases and the Orphanet database. 
    Based on the category "${category}" and the initial presentation: "${initialSymptoms}", 
    identify up to 15 potential rare diseases from the Orphanet database.
    For these diseases, provide a list of 20 specific, discriminating symptoms (clinical manifestations) that would help differentiate between them.
    
    Return the result in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          candidates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                orphanetId: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["id", "name", "orphanetId", "category"]
            }
          },
          discriminatingSymptoms: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["candidates", "discriminatingSymptoms"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function calculateFinalRanking(
  category: string, 
  initialSymptoms: string, 
  selectedRefinedSymptoms: string[],
  candidates: any[]
) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are an expert in rare diseases and the Orphanet database.
    Category: ${category}
    Initial Presentation: ${initialSymptoms}
    Confirmed Specific Symptoms: ${selectedRefinedSymptoms.join(", ")}
    Candidate Diseases: ${candidates.map(c => c.name).join(", ")}

    For each candidate disease, calculate a weighted match score (0-100) based on Orphanet frequency logic:
    - Obligatory/Always (1.0)
    - Frequent (0.7)
    - Occasional (0.3)
    
    Return the top 10 most probable diagnoses. For each, include:
    1. Weighted match score.
    2. Specific Orphanet symptoms that match.
    3. Recommended genetic tests (Gene Symbol and Method).
    4. Orphanet ID.
    
    Return the result in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                orphanetId: { type: Type.STRING },
                category: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
                description: { type: Type.STRING },
                symptoms: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      frequency: { type: Type.STRING, enum: Object.values(Frequency) }
                    }
                  }
                },
                geneticTests: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      geneSymbol: { type: Type.STRING },
                      method: { type: Type.STRING }
                    }
                  }
                }
              },
              required: ["id", "name", "orphanetId", "matchScore", "symptoms", "geneticTests"]
            }
          }
        },
        required: ["results"]
      }
    }
  });

  return JSON.parse(response.text).results as Disease[];
}
