import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Project, Task } from '../types';

interface ProjectStatsProps {
  projects: Project[];
  tasks: Task[];
}

export default function ProjectStats({ projects, tasks }: ProjectStatsProps) {
  const data = projects.map(proj => ({
    name: proj.name,
    taskCount: tasks.filter(t => t.projectId === proj.id).length,
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
      <h2 className="text-lg font-bold tracking-tight text-white mb-6">Projekt Teljesítmény</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
            <Tooltip 
                cursor={{fill: '#1f2937'}}
                contentStyle={{backgroundColor: '#030712', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff'}}
            />
            <Bar dataKey="taskCount" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={'#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
