export type GenerationType = 'chords' | 'melody' | 'bass' | 'composition';

export type ChordT = {
	name: string;
	inversion: number;
	startTime: number;
	voicing: 'drop2' | 'drop3' | 'drop2and4' | 'standard' | 'open' | 'closed' | 'spread' | 'cluster';
	octaveOffset: number;
	duration: number;
};

export type ProgressionT = {
	name: string;
	description: string;
	key: string;
	scale: string;
	bpm: number;
	baseOctave: number;
	chords: ChordT[];
};

export type NoteT = {
	pitch: number; // MIDI note number
	startTime: number; // in ticks (based on 96 PPQ)
	duration: number; // in ticks
	velocity: number; // 0-127
};

export type MelodyT = {
	name: string;
	description: string;
	key: string;
	scale: string;
	bpm: number;
	baseOctave: number;
	notes: NoteT[];
};

export type BasslineT = {
	name: string;
	description: string;
	key: string;
	scale: string;
	bpm: number;
	baseOctave: number;
	notes: NoteT[];
};

export type ChordsResponseT = {
	progressions: ProgressionT[];
};

export type MelodyResponseT = {
	melodies: MelodyT[];
};

export type BassResponseT = {
	basslines: BasslineT[];
};

export interface CompositionResponseT {
	compositions: Array<{
		name: string;
		description: string;
		key: string;
		scale: string;
		bpm: number;
		chordProgression: {
			baseOctave: number;
			chords: Array<{
				name: string;
				midiNotes: number[];
				inversion: number;
				startTime: number;
				voicing: string;
				octaveOffset: number;
				duration: number;
			}>;
		};
		melody: {
			baseOctave: number;
			notes: Array<{
				pitch: number;
				startTime: number;
				duration: number;
				velocity: number;
			}>;
		};
		bass: {
			baseOctave: number;
			notes: Array<{
				pitch: number;
				startTime: number;
				duration: number;
				velocity: number;
			}>;
		};
	}>;
}
