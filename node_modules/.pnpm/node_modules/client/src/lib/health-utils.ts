// src/lib/health-utils.ts
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
    2: "🔋",
    3: "🔋", 
    4: "🔋",
    5: "🔋"
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
    vigorous: "🏃‍♂️💨"
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

// Date helpers for health tracking
export const formatHealthDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

export const getWeekDates = (date: Date = new Date()): Date[] => {
  const week = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }
  
  return week;
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