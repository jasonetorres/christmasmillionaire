export interface TriviaQuestion {
  id: string;
  question: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty_level: number;
  category: string;
  is_used: boolean;
  created_at: string;
}

export interface GameState {
  id: string;
  current_question_id: string | null;
  current_level: number;
  game_status: string;
  selected_answer: string | null;
  show_correct: boolean;
  lifeline_fifty_fifty_used: boolean;
  lifeline_phone_used: boolean;
  lifeline_audience_used: boolean;
  removed_answers: string[];
  active_lifeline: string | null;
  total_winnings: string;
  current_question?: TriviaQuestion;
}

export interface AudienceVote {
  id: string;
  game_state_id: string;
  answer: 'A' | 'B' | 'C' | 'D';
  created_at: string;
}
