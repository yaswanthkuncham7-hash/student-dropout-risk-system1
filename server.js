const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mock Data
let students = [
  {
    id: '1',
    name: 'Emma Watson',
    grade: '10th Grade',
    attendance: 95, // %
    academicScore: 88, // %
    engagementScore: 90, // %
    activities: [
      { id: 101, text: 'Congratulated Emma on her recent exam score.', date: new Date(Date.now() - 86400000).toISOString() }
    ]
  },
  {
    id: '2',
    name: 'John Doe',
    grade: '10th Grade',
    attendance: 65,
    academicScore: 54,
    engagementScore: 40,
    activities: []
  },
  {
    id: '3',
    name: 'Sarah Connor',
    grade: '11th Grade',
    attendance: 82,
    academicScore: 75,
    engagementScore: 65,
    activities: []
  },
  {
    id: '4',
    name: 'Michael Smith',
    grade: '9th Grade',
    attendance: 98,
    academicScore: 92,
    engagementScore: 85,
    activities: []
  },
  {
    id: '5',
    name: 'Alex Johnson',
    grade: '12th Grade',
    attendance: 50,
    academicScore: 45,
    engagementScore: 30,
    activities: []
  }
];

// Utility: Determine Risk based on Rules
function calculateRisk(student) {
  let riskLevel = 'Low';
  let score = 100 - ((student.attendance * 0.4) + (student.academicScore * 0.4) + (student.engagementScore * 0.2));
  
  // High Risk thresholds
  if (student.attendance < 60 || student.academicScore < 50 || student.engagementScore < 40) {
    riskLevel = 'High';
  } 
  // Medium Risk thresholds
  else if (student.attendance < 80 || student.academicScore < 70 || student.engagementScore < 65) {
    riskLevel = 'Medium';
  }

  let factors = [];
  if (student.attendance < 80) factors.push('Low Attendance');
  if (student.academicScore < 70) factors.push('Academic Struggles');
  if (student.engagementScore < 65) factors.push('Low Participation/Engagement');

  return { riskLevel, score: Math.round(score), factors };
}

function getIntervention(riskLevel, factors) {
  if (riskLevel === 'Low') {
    return { 
      priority: 'Low', 
      recommendation: 'Periodic Check-ins.', 
      reason: 'Student is meeting all primary performance benchmarks.' 
    };
  }
  
  const factorsList = factors.length > 0 ? factors.join(' and ') : 'unspecified trends';
  
  if (riskLevel === 'High') {
    let recommendation = 'Immediate Intervention Required.';
    if (factors.includes('Low Participation/Engagement')) {
      recommendation = 'In-depth Counseling & Behavioral Review.';
    } else if (factors.includes('Academic Struggles')) {
      recommendation = 'Mandatory Tutoring & Academic Support Plan.';
    } else {
      recommendation = 'Mentor Assignment & Home Visit.';
    }

    return {
      priority: 'High',
      recommendation,
      reason: `Critical risk alert triggered due to ${factorsList}. Immediate action is necessary to prevent dropout.`
    };
  }

  // Medium Risk Reasoning
  let recommendation = 'Supportive Monitoring.';
  if (factors.includes('Low Participation/Engagement')) {
    recommendation = 'Peer Mentorship & Participation Strategy.';
  } else if (factors.includes('Academic Struggles')) {
    recommendation = 'Individual Academic Coaching.';
  }

  return {
    priority: 'Medium',
    recommendation,
    reason: `Preemptive warning signs identified in ${factorsList}. Support should be provided to stabilize performance.`
  };
}

// APIs
app.get('/api/students', (req, res) => {
  const analyzedStudents = students.map(s => {
    const risk = calculateRisk(s);
    return {
      ...s,
      riskLevel: risk.riskLevel,
      riskScore: risk.score,
      riskFactors: risk.factors,
      intervention: getIntervention(risk.riskLevel, risk.factors)
    };
  });
  res.json(analyzedStudents);
});

app.post('/api/students', (req, res) => {
  const newId = (students.length + 1).toString();
  const newStudent = {
    id: newId,
    name: req.body.name,
    grade: req.body.grade,
    attendance: parseInt(req.body.attendance, 10),
    academicScore: parseInt(req.body.academicScore, 10),
    engagementScore: parseInt(req.body.engagementScore, 10),
    activities: []
  };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

app.get('/api/students/:id', (req, res) => {
  const s = students.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  
  const risk = calculateRisk(s);
  res.json({
    ...s,
    riskLevel: risk.riskLevel,
    riskScore: risk.score,
    riskFactors: risk.factors,
    intervention: getIntervention(risk.riskLevel, risk.factors),
    activities: s.activities || [],
    // Mock historical data for charts
    history: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      attendance: [s.attendance + 5, s.attendance + 2, s.attendance - 1, s.attendance - 5, s.attendance, s.attendance],
      academic: [s.academicScore + 2, s.academicScore + 4, s.academicScore, s.academicScore - 2, s.academicScore - 5, s.academicScore],
    }
  });
});

app.post('/api/students/:id/activity', (req, res) => {
  const s = students.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  
  if (!s.activities) s.activities = [];
  
  const newActivity = {
    id: Date.now(),
    text: req.body.text,
    date: new Date().toISOString()
  };
  
  s.activities.unshift(newActivity); // Add to beginning of array
  res.status(201).json(newActivity);
});

app.put('/api/students/:id', (req, res) => {
  const s = students.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });

  if (req.body.attendance !== undefined) s.attendance = parseInt(req.body.attendance, 10);
  if (req.body.academicScore !== undefined) s.academicScore = parseInt(req.body.academicScore, 10);
  if (req.body.engagementScore !== undefined) s.engagementScore = parseInt(req.body.engagementScore, 10);

  res.json(s);
});

app.get('/api/stats', (req, res) => {
  const analyzed = students.map(s => calculateRisk(s));
  const high = analyzed.filter(r => r.riskLevel === 'High').length;
  const medium = analyzed.filter(r => r.riskLevel === 'Medium').length;
  const low = analyzed.filter(r => r.riskLevel === 'Low').length;

  res.json({
    totalStudents: students.length,
    riskDistribution: { high, medium, low },
    averageAttendance: Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / students.length)
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
