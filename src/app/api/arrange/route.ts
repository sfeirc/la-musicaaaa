import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the schema for a single note
const NoteSchema = z.object({
  frequency: z.number().min(20).max(20000).describe("Fréquence en Hz (20-20000)"),
  duration: z.number().min(0.01).max(10).describe("Durée en secondes (0.01-10)"),
  note_name: z.string().optional().describe("Nom de la note optionnel comme 'Do4', 'Fa#5', etc."),
  is_rest: z.boolean().optional().describe("Vrai si c'est un silence/pause"),
});

// Define the schema for the complete arrangement
const ArrangementSchema = z.object({
  title: z.string().describe("Titre ou description de l'arrangement musical"),
  tempo_bpm: z.number().min(60).max(200).describe("Tempo en battements par minute"),
  key_signature: z.string().describe("Tonalité comme 'Do majeur', 'La mineur', etc."),
  notes: z.array(NoteSchema).min(1).max(100).describe("Tableau de notes en séquence"),
  total_duration: z.number().describe("Durée totale de l'arrangement en secondes"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Une description musicale est requise et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée' },
        { status: 500 }
      );
    }

    // Create the system prompt for music generation
    const systemPrompt = `Vous êtes un compositeur IA qui crée des arrangements musicaux précis.

À partir de la demande musicale de l'utilisateur, générez une séquence de notes avec des fréquences et durées exactes.

Directives:
- Utilisez les fréquences musicales occidentales standard (La4 = 440Hz)
- Gardez les arrangements entre 5-50 notes pour la jouabilité
- Incluez des silences (is_rest: true) pour le phrasé musical
- Utilisez des durées réalistes (0.1-2.0 secondes typiquement)
- Respectez le style, tempo et tonalité demandés
- Pour les riffs/mélodies, utilisez répétition et variation
- Pour les progressions d'accords, utilisez des intervalles harmoniques appropriés

Références de fréquences courantes:
- Do4: 261.63 Hz, Ré4: 293.66 Hz, Mi4: 329.63 Hz, Fa4: 349.23 Hz
- Sol4: 392.00 Hz, La4: 440.00 Hz, Si4: 493.88 Hz
- Do5: 523.25 Hz, etc.

Fournissez toujours note_name quand possible (ex: "Do4", "Fa#5").

Répondez en français pour les titres et descriptions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "musical_arrangement",
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Titre ou description de l'arrangement musical"
              },
              tempo_bpm: {
                type: "number",
                minimum: 60,
                maximum: 200,
                description: "Tempo en battements par minute"
              },
              key_signature: {
                type: "string",
                description: "Tonalité comme 'Do majeur', 'La mineur', etc."
              },
              notes: {
                type: "array",
                minItems: 1,
                maxItems: 100,
                items: {
                  type: "object",
                  properties: {
                    frequency: {
                      type: "number",
                      minimum: 20,
                      maximum: 20000,
                      description: "Fréquence en Hz (20-20000)"
                    },
                    duration: {
                      type: "number",
                      minimum: 0.01,
                      maximum: 10,
                      description: "Durée en secondes (0.01-10)"
                    },
                    note_name: {
                      type: "string",
                      description: "Nom de la note optionnel comme 'Do4', 'Fa#5', etc."
                    },
                    is_rest: {
                      type: "boolean",
                      description: "Vrai si c'est un silence/pause"
                    }
                  },
                  required: ["frequency", "duration"],
                  additionalProperties: false
                },
                description: "Tableau de notes en séquence"
              },
              total_duration: {
                type: "number",
                description: "Durée totale de l'arrangement en secondes"
              }
            },
            required: ["title", "tempo_bpm", "key_signature", "notes", "total_duration"],
            additionalProperties: false
          }
        },
      },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      throw new Error('Échec de la génération de l\'arrangement musical');
    }

    // Parse the JSON response
    let arrangement;
    try {
      arrangement = JSON.parse(messageContent);
    } catch (error) {
      throw new Error('Format de réponse JSON invalide');
    }

    // Validate the generated arrangement
    const validatedArrangement = ArrangementSchema.parse(arrangement);

    return NextResponse.json({
      success: true,
      arrangement: validatedArrangement,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('Erreur lors de la génération de l\'arrangement musical:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Format d\'arrangement invalide',
          details: error.errors 
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Échec de la génération de l\'arrangement musical',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
