export const TOTAL_DAYS = 65;

// A day counts toward your streak / total only if it was marked complete
// AND hit at least this percentage. 100 = strict (every task). Lower it (e.g. 85) to be lenient.
export const PASS_THRESHOLD = 100;

export const PILLARS = [
  {
    id: 'physical',
    title: 'Physical Optimization',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    tasks: [
      { id: 'macros', label: 'Logged and hit daily macro/protein targets' },
      { id: 'training', label: 'Completed scheduled lifting or running session (or active recovery day)' },
      { id: 'water', label: 'Drank 3-4 liters of water' },
    ],
  },
  {
    id: 'cognitive',
    title: 'Cognitive & Mental Peak',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
    tasks: [
      { id: 'deepwork', label: 'Completed one 90-minute deep work block (CS coursework or BioBytes development)' },
      { id: 'braindump', label: 'Wrote down the "Brain Dump" / top 3 tasks for tomorrow' },
    ],
  },
  {
    id: 'recovery',
    title: 'Recovery & Lifestyle',
    dot: 'bg-violet-400',
    text: 'text-violet-300',
    tasks: [
      { id: 'sleep', label: 'Achieved 7-8 hours of sleep' },
      { id: 'nosugar', label: 'Consumed zero alcohol or sugary liquid calories' },
    ],
  },
];

export const ALL_TASKS = PILLARS.flatMap((p) => p.tasks);
