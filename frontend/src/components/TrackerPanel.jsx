import { Activity, Droplets, Dumbbell, Footprints, Heart, Pill, Plus, Scale } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, apiErrorMessage } from '../api/client.js';

const today = () => new Date().toISOString().slice(0, 10);

const trackerMeta = {
  symptoms: { label: 'Symptoms', icon: Heart },
  weight: { label: 'Weight', icon: Scale },
  water: { label: 'Water', icon: Droplets },
  exercise: { label: 'Exercise', icon: Dumbbell },
  steps: { label: 'Steps', icon: Footprints },
  mood: { label: 'Mood', icon: Activity },
  medications: { label: 'Medication', icon: Pill },
};

function latestText(type, item) {
  if (!item) return 'No entries yet';
  if (type === 'symptoms') return `${new Date(item.date).toLocaleDateString()} - acne ${item.acne}/10 - hair fall ${item.hairFall}/10`;
  if (type === 'weight') return `${item.weightKg} kg on ${new Date(item.date).toLocaleDateString()}`;
  if (type === 'water') return `${item.volumeMl} ml on ${new Date(item.date).toLocaleDateString()}`;
  if (type === 'exercise') return `${item.activity} - ${item.minutes} min`;
  if (type === 'steps') return `${item.steps} steps`;
  if (type === 'mood') return `${item.mood} - stress ${item.stressLevel}/10`;
  if (type === 'medications') return `${item.name} - ${item.dosage}`;
  return 'Latest entry available';
}

function TrackerCard({ type, latest, children }) {
  const Icon = trackerMeta[type].icon;
  return (
    <section className="card tracker-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Log</p>
          <h2>{trackerMeta[type].label}</h2>
        </div>
        <div className="tracker-icon">
          <Icon size={18} />
        </div>
      </div>
      <p className="latest-line">{latestText(type, latest)}</p>
      {children}
    </section>
  );
}

export default function TrackerPanel({ latest = {}, onChanged }) {
  const [status, setStatus] = useState('');
  const [symptoms, setSymptoms] = useState({
    date: today(),
    cycleLengthDays: '',
    cycleDay: '',
    periodFlow: 'none',
    cramps: 0,
    acne: 0,
    hairFall: 0,
    moodSwings: 0,
    bloating: 0,
    fatigue: 0,
    notes: '',
  });
  const [weight, setWeight] = useState({ date: today(), weightKg: '', waistCm: '', notes: '' });
  const [water, setWater] = useState({ date: today(), volumeMl: 2000, targetMl: 2500, notes: '' });
  const [exercise, setExercise] = useState({ date: today(), activity: 'Walk', minutes: 30, caloriesBurned: 120, intensity: 'moderate' });
  const [steps, setSteps] = useState({ date: today(), steps: '', caloriesBurned: '' });
  const [mood, setMood] = useState({ date: today(), mood: 'good', stressLevel: 3, sleepHours: 7, notes: '' });
  const [medication, setMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'Daily',
    reminderTime: '09:00',
    startDate: today(),
    notes: '',
  });

  const setters = useMemo(
    () => ({
      symptoms: setSymptoms,
      weight: setWeight,
      water: setWater,
      exercise: setExercise,
      steps: setSteps,
      mood: setMood,
      medication: setMedication,
    }),
    [],
  );

  const update = (group, key, value) => {
    setters[group]((current) => ({ ...current, [key]: value }));
  };

  const submit = async (type, payload, reset) => {
    setStatus(`Saving ${trackerMeta[type].label.toLowerCase()}...`);
    try {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== '' && value !== null && value !== undefined),
      );
      const { data } = await api.post(`/trackers/${type}`, cleanPayload);

      if (type === 'medications' && data.reminderTime) {
        await api.post('/notifications', {
          title: `Take ${data.name}`,
          message: `${data.dosage} - ${data.frequency}`,
          type: 'medicine',
          reminderAt: `${data.startDate.slice(0, 10)}T${data.reminderTime}:00`,
          repeat: 'daily',
          relatedModel: 'MedicationLog',
          relatedId: data._id,
        });
      }

      reset?.();
      setStatus(`${trackerMeta[type].label} saved`);
      onChanged?.();
    } catch (error) {
      setStatus(apiErrorMessage(error, 'Could not save log'));
    }
  };

  return (
    <div>
      <div className="section-heading page-heading">
        <div>
          <p className="eyebrow">Daily trackers</p>
          <h2>Record symptoms, habits, and medicines</h2>
        </div>
        {status ? <span className="form-status">{status}</span> : null}
      </div>

      <div className="tracker-grid">
        <TrackerCard type="symptoms" latest={latest.symptoms}>
          <form
            className="compact-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit('symptoms', symptoms);
            }}
          >
            <label>Date<input type="date" value={symptoms.date} onChange={(event) => update('symptoms', 'date', event.target.value)} /></label>
            <label>Cycle day<input type="number" min="1" max="120" value={symptoms.cycleDay} onChange={(event) => update('symptoms', 'cycleDay', event.target.value)} /></label>
            <label>Cycle length<input type="number" min="10" max="120" value={symptoms.cycleLengthDays} onChange={(event) => update('symptoms', 'cycleLengthDays', event.target.value)} /></label>
            <label>Flow<select value={symptoms.periodFlow} onChange={(event) => update('symptoms', 'periodFlow', event.target.value)}><option value="none">None</option><option value="spotting">Spotting</option><option value="light">Light</option><option value="medium">Medium</option><option value="heavy">Heavy</option></select></label>
            {['cramps', 'acne', 'hairFall', 'moodSwings', 'bloating', 'fatigue'].map((field) => (
              <label key={field}>
                {field.replace(/([A-Z])/g, ' $1')}
                <input type="range" min="0" max="10" value={symptoms[field]} onChange={(event) => update('symptoms', field, Number(event.target.value))} />
                <span className="range-value">{symptoms[field]}/10</span>
              </label>
            ))}
            <label className="full-span">Notes<textarea value={symptoms.notes} onChange={(event) => update('symptoms', 'notes', event.target.value)} /></label>
            <button className="primary-button full-span" type="submit"><Plus size={16} /> Add symptoms</button>
          </form>
        </TrackerCard>

        <TrackerCard type="weight" latest={latest.weight}>
          <form className="compact-form" onSubmit={(event) => { event.preventDefault(); submit('weight', weight); }}>
            <label>Date<input type="date" value={weight.date} onChange={(event) => update('weight', 'date', event.target.value)} /></label>
            <label>Weight kg<input type="number" min="20" max="300" step="0.1" required value={weight.weightKg} onChange={(event) => update('weight', 'weightKg', event.target.value)} /></label>
            <label>Waist cm<input type="number" min="30" max="250" step="0.1" value={weight.waistCm} onChange={(event) => update('weight', 'waistCm', event.target.value)} /></label>
            <label className="full-span">Notes<textarea value={weight.notes} onChange={(event) => update('weight', 'notes', event.target.value)} /></label>
            <button className="primary-button full-span" type="submit"><Plus size={16} /> Add weight</button>
          </form>
        </TrackerCard>

        <TrackerCard type="water" latest={latest.water}>
          <form className="compact-form" onSubmit={(event) => { event.preventDefault(); submit('water', water); }}>
            <label>Date<input type="date" value={water.date} onChange={(event) => update('water', 'date', event.target.value)} /></label>
            <label>Water ml<input type="number" min="50" max="10000" required value={water.volumeMl} onChange={(event) => update('water', 'volumeMl', event.target.value)} /></label>
            <label>Target ml<input type="number" min="500" max="8000" value={water.targetMl} onChange={(event) => update('water', 'targetMl', event.target.value)} /></label>
            <label className="full-span">Notes<textarea value={water.notes} onChange={(event) => update('water', 'notes', event.target.value)} /></label>
            <button className="primary-button full-span" type="submit"><Plus size={16} /> Add water</button>
          </form>
        </TrackerCard>

        <TrackerCard type="exercise" latest={latest.exercise}>
          <form className="compact-form" onSubmit={(event) => { event.preventDefault(); submit('exercise', exercise); }}>
            <label>Date<input type="date" value={exercise.date} onChange={(event) => update('exercise', 'date', event.target.value)} /></label>
            <label>Activity<input required value={exercise.activity} onChange={(event) => update('exercise', 'activity', event.target.value)} /></label>
            <label>Minutes<input type="number" min="1" max="600" required value={exercise.minutes} onChange={(event) => update('exercise', 'minutes', event.target.value)} /></label>
            <label>Calories<input type="number" min="0" max="5000" value={exercise.caloriesBurned} onChange={(event) => update('exercise', 'caloriesBurned', event.target.value)} /></label>
            <label>Intensity<select value={exercise.intensity} onChange={(event) => update('exercise', 'intensity', event.target.value)}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></select></label>
            <button className="primary-button full-span" type="submit"><Plus size={16} /> Add exercise</button>
          </form>
        </TrackerCard>

        <TrackerCard type="steps" latest={latest.steps}>
          <form className="compact-form" onSubmit={(event) => { event.preventDefault(); submit('steps', steps); }}>
            <label>Date<input type="date" value={steps.date} onChange={(event) => update('steps', 'date', event.target.value)} /></label>
            <label>Steps<input type="number" min="0" max="100000" required value={steps.steps} onChange={(event) => update('steps', 'steps', event.target.value)} /></label>
            <label>Calories<input type="number" min="0" max="5000" value={steps.caloriesBurned} onChange={(event) => update('steps', 'caloriesBurned', event.target.value)} /></label>
            <button className="primary-button full-span" type="submit"><Plus size={16} /> Add steps</button>
          </form>
        </TrackerCard>

        <TrackerCard type="mood" latest={latest.mood}>
          <form className="compact-form" onSubmit={(event) => { event.preventDefault(); submit('mood', mood); }}>
            <label>Date<input type="date" value={mood.date} onChange={(event) => update('mood', 'date', event.target.value)} /></label>
            <label>Mood<select value={mood.mood} onChange={(event) => update('mood', 'mood', event.target.value)}><option value="great">Great</option><option value="good">Good</option><option value="okay">Okay</option><option value="low">Low</option><option value="anxious">Anxious</option><option value="irritable">Irritable</option></select></label>
            <label>Stress<input type="range" min="0" max="10" value={mood.stressLevel} onChange={(event) => update('mood', 'stressLevel', Number(event.target.value))} /><span className="range-value">{mood.stressLevel}/10</span></label>
            <label>Sleep hours<input type="number" min="0" max="24" step="0.5" value={mood.sleepHours} onChange={(event) => update('mood', 'sleepHours', event.target.value)} /></label>
            <label className="full-span">Notes<textarea value={mood.notes} onChange={(event) => update('mood', 'notes', event.target.value)} /></label>
            <button className="primary-button full-span" type="submit"><Plus size={16} /> Add mood</button>
          </form>
        </TrackerCard>

        <TrackerCard type="medications" latest={latest.medications}>
          <form className="compact-form" onSubmit={(event) => { event.preventDefault(); submit('medications', medication); }}>
            <label>Name<input required value={medication.name} onChange={(event) => update('medication', 'name', event.target.value)} /></label>
            <label>Dosage<input required value={medication.dosage} onChange={(event) => update('medication', 'dosage', event.target.value)} /></label>
            <label>Frequency<input required value={medication.frequency} onChange={(event) => update('medication', 'frequency', event.target.value)} /></label>
            <label>Reminder<input type="time" value={medication.reminderTime} onChange={(event) => update('medication', 'reminderTime', event.target.value)} /></label>
            <label>Start date<input type="date" value={medication.startDate} onChange={(event) => update('medication', 'startDate', event.target.value)} /></label>
            <label className="full-span">Notes<textarea value={medication.notes} onChange={(event) => update('medication', 'notes', event.target.value)} /></label>
            <button className="primary-button full-span" type="submit"><Plus size={16} /> Add medicine</button>
          </form>
        </TrackerCard>
      </div>
    </div>
  );
}
