// src/Components/health/helpers.ts - Complete version with all missing functions

// Date helpers
export const todayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return d.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  return d.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('nl-NL', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
};

// Mood helpers
export type Mood = "great" | "good" | "neutral" | "bad" | "terrible";

export const moodEmoji = (mood?: Mood): string => {
  const emojiMap = {
    great: "😄",
    good: "🙂", 
    neutral: "😐",
    bad: "😞",
    terrible: "😢"
  };
  
  return emojiMap[mood ?? "neutral"];
};

export const moodLabel = (mood?: Mood): string => {
  const labelMap = {
    great: "Geweldig",
    good: "Goed",
    neutral: "Neutraal", 
    bad: "Slecht",
    terrible: "Verschrikkelijk"
  };
  
  return labelMap[mood ?? "neutral"];
};

export const moodColor = (mood?: Mood): string => {
  const colorMap = {
    great: "text-green-600 bg-green-50",
    good: "text-blue-600 bg-blue-50",
    neutral: "text-yellow-600 bg-yellow-50",
    bad: "text-orange-600 bg-orange-50", 
    terrible: "text-red-600 bg-red-50"
  };
  
  return colorMap[mood ?? "neutral"];
};

// Energy level helpers
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export const energyEmoji = (level: EnergyLevel): string => {
  const emojiMap = {
    1: "🔋",
    2: "🔋🔋",
    3: "🔋🔋🔋", 
    4: "🔋🔋🔋🔋",
    5: "🔋🔋🔋🔋🔋"
  };
  
  return emojiMap[level];
};

export const energyLabel = (level: EnergyLevel): string => {
  const labelMap = {
    1: "Zeer laag",
    2: "Laag", 
    3: "Gemiddeld",
    4: "Hoog",
    5: "Zeer hoog"
  };
  
  return labelMap[level];
};

export const energyColor = (level: EnergyLevel): string => {
  const colorMap = {
    1: "text-red-600 bg-red-50",
    2: "text-orange-600 bg-orange-50",
    3: "text-yellow-600 bg-yellow-50",
    4: "text-blue-600 bg-blue-50", 
    5: "text-green-600 bg-green-50"
  };
  
  return colorMap[level];
};

// Meal type helpers
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const mealTypeLabel = (type: MealType): string => {
  const labelMap = {
    breakfast: "Ontbijt",
    lunch: "Lunch",
    dinner: "Diner",
    snack: "Snack"
  };
  
  return labelMap[type];
};

export const mealTypeEmoji = (type: MealType): string => {
  const emojiMap = {
    breakfast: "🥞",
    lunch: "🥙",
    dinner: "🍽️",
    snack: "🍪"
  };
  
  return emojiMap[type];
};

export const mealTypeColor = (type: MealType): string => {
  const colorMap = {
    breakfast: "text-yellow-600 bg-yellow-50",
    lunch: "text-blue-600 bg-blue-50",
    dinner: "text-purple-600 bg-purple-50",
    snack: "text-green-600 bg-green-50"
  };
  
  return colorMap[type];
};

// Steps helpers
export type StepsGoalStatus = 'none' | 'started' | 'halfway' | 'almost' | 'achieved' | 'exceeded';

export const stepsGoalStatus = (current: number, goal: number): StepsGoalStatus => {
  if (current === 0) return 'none';
  if (current >= goal * 1.2) return 'exceeded';
  if (current >= goal) return 'achieved';
  if (current >= goal * 0.8) return 'almost';
  if (current >= goal * 0.5) return 'halfway';
  return 'started';
};

export const stepsGoalColor = (status: StepsGoalStatus): string => {
  const colorMap = {
    none: 'text-gray-500 bg-gray-50',
    started: 'text-orange-600 bg-orange-50',
    halfway: 'text-yellow-600 bg-yellow-50',
    almost: 'text-blue-600 bg-blue-50',
    achieved: 'text-green-600 bg-green-50',
    exceeded: 'text-purple-600 bg-purple-50'
  };
  
  return colorMap[status];
};

export const stepsGoalMessage = (status: StepsGoalStatus): string => {
  const messageMap = {
    none: 'Nog niet begonnen',
    started: 'Goed bezig!',
    halfway: 'Halverwege!',
    almost: 'Bijna daar!',
    achieved: 'Doel behaald!',
    exceeded: 'Doel overtroffen!'
  };
  
  return messageMap[status];
};

// BMI calculations
export const calculateBMI = (weight: number, height: number): number => {
  return weight / ((height / 100) ** 2);
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Ondergewicht";
  if (bmi < 25) return "Normaal gewicht";
  if (bmi < 30) return "Overgewicht";
  return "Obesitas";
};

export const getBMIColor = (bmi: number): string => {
  if (bmi < 18.5) return "text-blue-600 bg-blue-50";
  if (bmi < 25) return "text-green-600 bg-green-50";
  if (bmi < 30) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
};

// Workout intensity helpers
export type WorkoutIntensity = "light" | "moderate" | "vigorous";

export const intensityEmoji = (intensity: WorkoutIntensity): string => {
  const emojiMap = {
    light: "🚶",
    moderate: "🏃",
    vigorous: "🏃💨"
  };
  
  return emojiMap[intensity];
};

export const intensityLabel = (intensity: WorkoutIntensity): string => {
  const labelMap = {
    light: "Licht",
    moderate: "Gemiddeld",
    vigorous: "Intensief"
  };
  
  return labelMap[intensity];
};

export const intensityColor = (intensity: WorkoutIntensity): string => {
  const colorMap = {
    light: "text-green-600 bg-green-50",
    moderate: "text-yellow-600 bg-yellow-50", 
    vigorous: "text-red-600 bg-red-50"
  };
  
  return colorMap[intensity];
};

// Percentage calculation
export const calculatePercentage = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

// Progress bar calculation
export const getProgressWidth = (current: number, goal: number): number => {
  const percentage = calculatePercentage(current, goal);
  return Math.min(percentage, 100);
};

// Distance formatting
export const formatDistance = (steps: number, stepLength: number = 0.65): string => {
  const meters = steps * stepLength;
  const kilometers = meters / 1000;
  
  if (kilometers >= 1) {
    return `${formatNumber(kilometers, 1)} km`;
  }
  
  return `${formatNumber(meters, 0)} m`;
};

// Calories calculation
export const estimateCaloriesBurned = (steps: number, weight: number = 70): number => {
  return Math.round(steps * 0.04 * (weight / 70));
};

// Nutrition helpers
export const calculateCalories = (
  protein: number,
  carbs: number, 
  fat: number
): number => {
  return (protein * 4) + (carbs * 4) + (fat * 9);
};

export const getMacroPercentage = (
  macro: number,
  totalCalories: number,
  caloriesPerGram: number
): number => {
  return (macro * caloriesPerGram / totalCalories) * 100;
};

// Time formatting
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}u`;
  }
  
  return `${hours}u ${remainingMinutes}min`;
};

// Week helpers
export const getWeekDays = (startDate: Date = new Date()): Date[] => {
  const week = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay() + 1);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    week.push(day);
  }
  
  return week;
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('nl-NL', { weekday: 'short' });
};

// Goal achievement helpers
export const getStreakDays = (activities: Array<{ date: string; achieved: boolean }>): number => {
  let streak = 0;
  const sortedActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  for (const activity of sortedActivities) {
    if (activity.achieved) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

export const getWeeklyAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / values.length);
};