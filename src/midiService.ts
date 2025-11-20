import { GeneratedPart } from '../types';

// This tells TypeScript that 'MidiWriter' is a global variable on the window object
declare global {
	interface Window {
		MidiWriter: any;
	}
}

export const downloadMidi = (part: GeneratedPart) => {
	// Ensure the MidiWriter library is loaded from the CDN
	if (typeof window.MidiWriter === 'undefined') {
		console.error('MidiWriter.js script not loaded from CDN.');
		alert(
			'Error: The MIDI generation library is not available. Please check your internet connection and try again.'
		);
		return;
	}

	const track = new window.MidiWriter.Track();
	track.addEvent(new window.MidiWriter.ProgramChangeEvent({ instrument: 1 }));
	track.setTempo(part.bpm);

	const events = 'chords' in part ? part.chords : part.notes;

	events.forEach((event) => {
		const notes = 'midiNotes' in event ? event.midiNotes : [event.pitch];
		if (notes && notes.length > 0) {
			track.addEvent(
				new window.MidiWriter.NoteEvent({
					pitch: notes,
					startTick: event.startTime,
					duration: `T${event.duration}`,
					velocity: 'velocity' in event ? event.velocity : 100
				})
			);
		}
	});

	const write = new window.MidiWriter.Writer(track);
	const dataUri = write.dataUri();

	const link = document.createElement('a');
	link.href = dataUri;
	const safeFileName = part.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
	link.download = `${safeFileName}.mid`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
