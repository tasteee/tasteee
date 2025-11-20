import { GeneratedPart } from '../types';

// This tells TypeScript that these globals might exist on window
declare global {
	interface Window {
		webkitAudioContext: typeof AudioContext;
		Soundfont: any; // Soundfont-player global
	}
}

let context: AudioContext | null = null;
const loadedInstruments = new Map<string, any>();
let currentPlayingInstrument: any | null = null;
let onEndedTimeoutId: number | null = null;

const initializeAudio = async (instrumentName: string): Promise<any> => {
	if (loadedInstruments.has(instrumentName)) {
		return loadedInstruments.get(instrumentName);
	}

	if (typeof window.Soundfont === 'undefined') {
		console.error('Soundfont-player.js script not loaded from CDN.');
		throw new Error(
			'The audio playback library is not available. Please check your internet connection and try again.'
		);
	}

	if (!context) {
		context = new (window.AudioContext || window.webkitAudioContext)();
	}

	// Resume context if it was suspended by browser policies
	if (context.state === 'suspended') {
		await context.resume();
	}

	console.log(`Loading soundfont for: ${instrumentName}...`);
	try {
		const instrument = await window.Soundfont.instrument(context, instrumentName);
		loadedInstruments.set(instrumentName, instrument);
		console.log(`Soundfont for ${instrumentName} loaded.`);
		return instrument;
	} catch (error) {
		console.error(`Failed to load soundfont for ${instrumentName}:`, error);
		throw new Error(`Failed to load the sound for: ${instrumentName.replace(/_/g, ' ')}.`);
	}
};

export const playMidiPart = async (
	part: GeneratedPart,
	instrumentName: string,
	onEnded: () => void
) => {
	try {
		const instrumentInstance = await initializeAudio(instrumentName);

		if (!context) {
			throw new Error('AudioContext could not be created.');
		}

		stopPlayback();
		currentPlayingInstrument = instrumentInstance;

		if (context.state === 'suspended') {
			await context.resume();
		}

		const ppq = 96; // Pulses per quarter note
		const secondsPerTick = 60.0 / (part.bpm * ppq);
		const startTime = context.currentTime;
		let maxEndTime = 0;

		const events = 'chords' in part ? part.chords : part.notes;

		events.forEach((event) => {
			const notes = 'midiNotes' in event ? event.midiNotes : [event.pitch];
			if (notes && notes.length > 0) {
				const playTime = startTime + event.startTime * secondsPerTick;
				const duration = event.duration * secondsPerTick;
				const velocity = 'velocity' in event ? event.velocity : 100;

				// Play each note individually to avoid buffer lookup issues
				notes.forEach((note) => {
					instrumentInstance.play(note, playTime, {
						duration: duration * 0.95,
						gain: velocity / 127
					});
				});

				maxEndTime = Math.max(maxEndTime, playTime + duration);
			}
		});

		const totalDurationMs = (maxEndTime - startTime) * 1000;

		onEndedTimeoutId = window.setTimeout(() => {
			onEnded();
			onEndedTimeoutId = null;
			currentPlayingInstrument = null;
		}, totalDurationMs + 50); // Add a small buffer
	} catch (error) {
		console.error('Error playing midi part:', error);
		throw error instanceof Error ? error : new Error('Could not play audio.');
	}
};

export const stopPlayback = () => {
	if (onEndedTimeoutId) {
		clearTimeout(onEndedTimeoutId);
		onEndedTimeoutId = null;
	}

	if (currentPlayingInstrument && context) {
		// soundfont-player doesn't have a great stop-all-notes method,
		// but re-initializing the instrument reference effectively stops playback.
		// The library handles garbage collection of old nodes.
		currentPlayingInstrument = null;
	}
};
