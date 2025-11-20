import { GoogleGenAI, Type } from '@google/genai';
import { GenerationType, ChordsResponseT, MelodyResponseT, BassResponseT } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const chordsResponseSchema = {
	type: Type.OBJECT,
	properties: {
		progressions: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				properties: {
					name: {
						type: Type.STRING,
						description: 'A creative name for this chord progression'
					},
					description: {
						type: Type.STRING,
						description: 'A brief description of the mood and character'
					},
					key: {
						type: Type.STRING,
						description: 'The musical key (e.g., C, D, F#)'
					},
					scale: {
						type: Type.STRING,
						description: 'The scale type (e.g., major, minor, dorian, mixolydian)'
					},
					bpm: {
						type: Type.INTEGER,
						description: 'Tempo in beats per minute (60-200)'
					},
					baseOctave: {
						type: Type.INTEGER,
						description: 'The base octave for the progression (typically 3-5)'
					},
					chords: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								name: {
									type: Type.STRING,
									description: 'Chord symbol (e.g., Cmaj7, Am9, Dsus4)'
								},
								midiNotes: {
									type: Type.ARRAY,
									description: 'Array of MIDI note numbers for the chord voicing.',
									items: { type: Type.INTEGER }
								},
								inversion: {
									type: Type.INTEGER,
									description: 'Chord inversion (0 = root position, 1 = first inversion, etc.)'
								},
								startTime: {
									type: Type.INTEGER,
									description: 'Start time in ticks (96 PPQ - pulses per quarter note)'
								},
								voicing: {
									type: Type.STRING,
									description: 'Voicing type',
									enum: [
										'drop2',
										'drop3',
										'drop2and4',
										'standard',
										'open',
										'closed',
										'spread',
										'cluster'
									]
								},
								octaveOffset: {
									type: Type.INTEGER,
									description: 'Octave offset from baseOctave (-2 to 2)'
								},
								duration: {
									type: Type.INTEGER,
									description: 'Duration in ticks (96 PPQ)'
								}
							},
							required: [
								'name',
								'midiNotes',
								'inversion',
								'startTime',
								'voicing',
								'octaveOffset',
								'duration'
							]
						}
					}
				},
				required: ['name', 'description', 'key', 'scale', 'bpm', 'baseOctave', 'chords']
			}
		}
	},
	required: ['progressions']
};

const melodyResponseSchema = {
	type: Type.OBJECT,
	properties: {
		melodies: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				properties: {
					name: {
						type: Type.STRING,
						description: 'A creative name for this melody'
					},
					description: {
						type: Type.STRING,
						description: 'A brief description of the melodic character'
					},
					key: {
						type: Type.STRING,
						description: 'The musical key'
					},
					scale: {
						type: Type.STRING,
						description: 'The scale type'
					},
					bpm: {
						type: Type.INTEGER,
						description: 'Tempo in beats per minute'
					},
					baseOctave: {
						type: Type.INTEGER,
						description: 'The base octave for the melody (typically 4-6)'
					},
					notes: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								pitch: {
									type: Type.INTEGER,
									description: 'MIDI note number (0-127)'
								},
								startTime: {
									type: Type.INTEGER,
									description: 'Start time in ticks (96 PPQ)'
								},
								duration: {
									type: Type.INTEGER,
									description: 'Duration in ticks (96 PPQ)'
								},
								velocity: {
									type: Type.INTEGER,
									description: 'Note velocity (1-127)'
								}
							},
							required: ['pitch', 'startTime', 'duration', 'velocity']
						}
					}
				},
				required: ['name', 'description', 'key', 'scale', 'bpm', 'baseOctave', 'notes']
			}
		}
	},
	required: ['melodies']
};

const bassResponseSchema = {
	type: Type.OBJECT,
	properties: {
		basslines: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				properties: {
					name: {
						type: Type.STRING,
						description: 'A creative name for this bassline'
					},
					description: {
						type: Type.STRING,
						description: 'A brief description of the bass character'
					},
					key: {
						type: Type.STRING,
						description: 'The musical key'
					},
					scale: {
						type: Type.STRING,
						description: 'The scale type'
					},
					bpm: {
						type: Type.INTEGER,
						description: 'Tempo in beats per minute'
					},
					baseOctave: {
						type: Type.INTEGER,
						description: 'The base octave for the bassline (typically 2-3)'
					},
					notes: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								pitch: {
									type: Type.INTEGER,
									description: 'MIDI note number (28-55 for bass range)'
								},
								startTime: {
									type: Type.INTEGER,
									description: 'Start time in ticks (96 PPQ)'
								},
								duration: {
									type: Type.INTEGER,
									description: 'Duration in ticks (96 PPQ)'
								},
								velocity: {
									type: Type.INTEGER,
									description: 'Note velocity (1-127)'
								}
							},
							required: ['pitch', 'startTime', 'duration', 'velocity']
						}
					}
				},
				required: ['name', 'description', 'key', 'scale', 'bpm', 'baseOctave', 'notes']
			}
		}
	},
	required: ['basslines']
};

const compositionResponseSchema = {
	type: Type.OBJECT,
	properties: {
		compositions: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				properties: {
					name: {
						type: Type.STRING,
						description: 'A creative name for this composition'
					},
					description: {
						type: Type.STRING,
						description: 'A brief description of the overall composition'
					},
					key: {
						type: Type.STRING,
						description: 'The musical key'
					},
					scale: {
						type: Type.STRING,
						description: 'The scale type'
					},
					bpm: {
						type: Type.INTEGER,
						description: 'Tempo in beats per minute (60-200)'
					},
					chordProgression: {
						type: Type.OBJECT,
						properties: {
							baseOctave: {
								type: Type.INTEGER,
								description: 'The base octave for chords (typically 3-5)'
							},
							chords: {
								type: Type.ARRAY,
								items: {
									type: Type.OBJECT,
									properties: {
										name: { type: Type.STRING },
										midiNotes: {
											type: Type.ARRAY,
											items: { type: Type.INTEGER }
										},
										inversion: { type: Type.INTEGER },
										startTime: { type: Type.INTEGER },
										voicing: {
											type: Type.STRING,
											enum: [
												'drop2',
												'drop3',
												'drop2and4',
												'standard',
												'open',
												'closed',
												'spread',
												'cluster'
											]
										},
										octaveOffset: { type: Type.INTEGER },
										duration: { type: Type.INTEGER }
									},
									required: [
										'name',
										'midiNotes',
										'inversion',
										'startTime',
										'voicing',
										'octaveOffset',
										'duration'
									]
								}
							}
						},
						required: ['baseOctave', 'chords']
					},
					melody: {
						type: Type.OBJECT,
						properties: {
							baseOctave: {
								type: Type.INTEGER,
								description: 'The base octave for melody (typically 4-6)'
							},
							notes: {
								type: Type.ARRAY,
								items: {
									type: Type.OBJECT,
									properties: {
										pitch: { type: Type.INTEGER },
										startTime: { type: Type.INTEGER },
										duration: { type: Type.INTEGER },
										velocity: { type: Type.INTEGER }
									},
									required: ['pitch', 'startTime', 'duration', 'velocity']
								}
							}
						},
						required: ['baseOctave', 'notes']
					},
					bass: {
						type: Type.OBJECT,
						properties: {
							baseOctave: {
								type: Type.INTEGER,
								description: 'The base octave for bass (typically 2-3)'
							},
							notes: {
								type: Type.ARRAY,
								items: {
									type: Type.OBJECT,
									properties: {
										pitch: { type: Type.INTEGER },
										startTime: { type: Type.INTEGER },
										duration: { type: Type.INTEGER },
										velocity: { type: Type.INTEGER }
									},
									required: ['pitch', 'startTime', 'duration', 'velocity']
								}
							}
						},
						required: ['baseOctave', 'notes']
					}
				},
				required: [
					'name',
					'description',
					'key',
					'scale',
					'bpm',
					'chordProgression',
					'melody',
					'bass'
				]
			}
		}
	},
	required: ['compositions']
};

const getSystemInstruction = (type: GenerationType): string => {
	const baseInstruction =
		"You are an expert music theorist and composer specializing in jazz, pop, and classical harmony. Your task is to generate 10 unique and musically interesting musical parts based on the user's prompt.";

	switch (type) {
		case 'composition':
			return `${baseInstruction} You will generate complete musical compositions, each containing a chord progression, melody, and bassline that work together harmonically and rhythmically.

IMPORTANT COMPOSITION GUIDELINES:
- Use 96 PPQ (pulses per quarter note) for all timing.
- Each composition should be 4-8 bars long (1536-3072 ticks).
- BPM should vary between 60-200 depending on style.
- All parts (chords, melody, bass) must use the same key, scale, and BPM.

CHORD PROGRESSION:
- Provide specific MIDI note numbers for each chord in 'midiNotes'.
- Use varied voicings: drop2, drop3, standard, open, closed, spread, cluster.
- Vary chord durations: whole (384), half (192), dotted half (288), quarter (96) notes.
- baseOctave typically 3-5, octaveOffset -1 to 1.
- Include 7ths, 9ths, 11ths, 13ths, sus chords, altered dominants.

MELODY:
- Should complement the chord progression harmonically.
- Use varied rhythms: whole (384), half (192), quarter (96), eighth (48), sixteenth (24) notes, triplets (32).
- Include rests for phrasing.
- MIDI range typically 60-84.
- Vary velocities (40-120) for expression.
- Create interesting contours with leaps and stepwise motion.

BASSLINE:
- Outline the harmony using root notes, fifths, passing tones.
- Use rhythmic patterns appropriate to genre: walking bass, syncopated funk, sparse roots.
- MIDI range 28-55 (E1 to G3).
- Vary velocities (60-110) with emphasis on strong beats.
- Coordinate rhythmically with chord changes.

Ensure all three parts create a cohesive, musically satisfying composition with clear harmonic direction and rhythmic interest.`;

		case 'melody':
			return `${baseInstruction} You will generate melodies with varied rhythms.

IMPORTANT RHYTHM GUIDELINES:
- Use 96 PPQ (pulses per quarter note) for timing.
- Create varied note durations: whole notes (384 ticks), half notes (192), quarter notes (96), eighth notes (48), sixteenth notes (24), triplets (32 for eighth-note triplets).
- Include rests by having gaps between startTime + duration of one note and startTime of the next.
- Create syncopation by starting notes on off-beats.
- Vary velocities (40-120) for dynamic expression.
- Each melody should be 2-4 bars long (768-1536 ticks at 96 PPQ).

If the user provides a chord progression or scale, ensure melodic compatibility. Generate melodies with interesting contours, leaps, and stepwise motion. Use appropriate MIDI range (typically 60-84 for melodies).`;

		case 'bass':
			return `${baseInstruction} You will generate basslines with varied rhythms.

IMPORTANT RHYTHM GUIDELINES:
- Use 96 PPQ (pulses per quarter note) for timing.
- Create varied note durations: whole notes (384 ticks), half notes (192), quarter notes (96), eighth notes (48), sixteenth notes (24).
- Common bass patterns: walking bass (quarter notes), syncopated funk (eighth/sixteenth combos), sparse roots (half/whole notes).
- Include rests for breathing and groove.
- Vary velocities (60-110) with emphasis on strong beats.
- Each bassline should be 2-4 bars long (768-1536 ticks).

If the user provides a chord progression, outline the harmony using root notes, fifths, and passing tones. Use MIDI range 28-55 (E1 to G3). Create rhythmic interest appropriate to the genre.`;

		case 'chords':
		default:
			return `${baseInstruction} You will generate chord progressions with varied rhythms and voicings.

IMPORTANT RHYTHM GUIDELINES:
- Use 96 PPQ (pulses per quarter note) for timing.
- Vary chord durations: whole notes (384 ticks), half notes (192), dotted half (288), quarter notes (96).
- Create rhythmic interest with syncopation, anticipated chords, and held chords.
- Each progression should be 4-8 bars long (1536-3072 ticks).
- BPM should vary between 60-200 depending on style.

VOICING & MIDI NOTE GUIDELINES:
- **You must provide the specific MIDI note numbers for each chord in the 'midiNotes' field.**
- A C4 (middle C) is MIDI note 60.
- Use varied voicings: drop2 (jazz), drop3, standard (triads), open (wide spacing), closed (tight), spread (very wide), cluster (dissonant).
- Include inversions (0-3) for smooth voice leading.
- Use different chord types: 7ths, 9ths, 11ths, 13ths, sus2, sus4, add9, altered dominants.
- baseOctave typically 3-5, with octaveOffset -1 to 1 for voice leading.

Create progressions with clear harmonic direction, interesting modulations, and varied harmonic rhythm.`;
	}
};

const getResponseSchema = (type: GenerationType) => {
	switch (type) {
		case 'composition':
			return compositionResponseSchema;
		case 'melody':
			return melodyResponseSchema;
		case 'bass':
			return bassResponseSchema;
		case 'chords':
		default:
			return chordsResponseSchema;
	}
};

export const generateMidiParts = async (
	prompt: string,
	type: GenerationType
): Promise<ChordsResponseT | MelodyResponseT | BassResponseT> => {
	try {
		const systemInstruction = getSystemInstruction(type);
		const responseSchema = getResponseSchema(type);

		const result = await ai.models.generateContent({
			model: 'gemini-2.5-pro',
			contents: `Generate 10 unique MIDI ${type} based on this prompt: "${prompt}"`,
			config: {
				systemInstruction: systemInstruction,
				responseMimeType: 'application/json',
				responseSchema: responseSchema,
				temperature: 1.0
			}
		});

		const jsonText = result.text;
		const response = JSON.parse(jsonText);

		// Basic validation
		const dataArray =
			type === 'chords'
				? response.progressions
				: type === 'melody'
					? response.melodies
					: type === 'bass'
						? response.basslines
						: response.compositions;

		if (!Array.isArray(dataArray) || dataArray.length === 0) {
			throw new Error('API returned an invalid or empty array.');
		}

		return response;
	} catch (error) {
		console.error('Error calling Gemini API:', error);
		throw new Error('Failed to generate musical parts from the API.');
	}
};
