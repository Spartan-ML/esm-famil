export const en = {
  // Home
  selectLanguage: "Choose your language",
  createGame: "Create Game",
  joinGame: "Join Game",
  tagline: "The classic word game, now online.",

  // Join
  enterCode: "Enter room code",
  roomCode: "Room Code",
  chooseColor: "Pick your color",
  enterName: "Your name",
  namePlaceholder: "Enter your name",
  join: "Join",
  joining: "Joining...",
  invalidCode: "Room not found. Check the code and try again.",
  roomClosed: "This room is no longer active.",

  // Lobby
  waitingForHost: "Waiting for host to start the game…",
  playersJoined: "Players",
  startGame: "Start Game",
  categories: "Categories",
  addCategory: "Add category",
  categoryPlaceholder: "e.g. Country, Animal, Food…",
  roundMode: "Round mode",
  timerMode: "Timer",
  finishMode: "First to finish",
  timerDuration: "Timer duration",
  seconds: "sec",
  chooseLetter: "Choose a letter",
  randomLetter: "Random",
  minCategories: "Add at least 5 categories to start.",
  copyCode: "Copy code",
  codeCopied: "Copied!",
  shareCode: "Share this code with friends",

  // Play
  round: "Round",
  letter: "Letter",
  timeLeft: "Time left",
  iFinished: "I'm Finished!",
  someoneFinished: "finished the round!",
  inputsLocked: "Round over — inputs locked.",
  category: "Category",

  // Vote
  votingPhase: "Voting Phase",
  voteInstruction: "Mark any answer you think is invalid.",
  invalid: "Invalid",
  valid: "Valid",
  submitVotes: "Submit Votes",
  yourAnswer: "Your answer",
  noAnswer: "No answer",

  // Scoreboard
  scoreboard: "Scoreboard",
  score: "Score",
  nextRound: "Next Round",
  endGame: "End Game",
  pickLetter: "Pick the next letter",
  pts: "pts",
  unique: "Unique",
  shared: "Shared",
  empty: "Empty",

  // Game over
  gameOver: "Game Over",
  finalScores: "Final Scores",
  winner: "Winner",
  playAgain: "Play Again",
  backHome: "Back to Home",

  needMorePlayers: "At least 2 players needed to start.",

  // Errors
  errorGeneric: "Something went wrong. Please try again.",
  sessionExpired: "Your session has expired. Please rejoin.",

  // Persian alphabet not shown in EN mode
  persianLetters: [],
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
};

export const fa: typeof en = {
  selectLanguage: "زبان خود را انتخاب کنید",
  createGame: "ساخت بازی",
  joinGame: "پیوستن به بازی",
  tagline: "بازی کلاسیک اسم فامیل، حالا آنلاین.",

  enterCode: "کد اتاق را وارد کنید",
  roomCode: "کد اتاق",
  chooseColor: "رنگ خود را انتخاب کنید",
  enterName: "اسم شما",
  namePlaceholder: "نام خود را وارد کنید",
  join: "پیوستن",
  joining: "در حال پیوستن...",
  invalidCode: "اتاق پیدا نشد. کد را بررسی کنید.",
  roomClosed: "این اتاق دیگر فعال نیست.",

  waitingForHost: "در انتظار شروع بازی توسط میزبان…",
  playersJoined: "بازیکنان",
  startGame: "شروع بازی",
  categories: "دسته‌بندی‌ها",
  addCategory: "افزودن دسته‌بندی",
  categoryPlaceholder: "مثلاً: کشور، حیوان، غذا…",
  roundMode: "حالت راند",
  timerMode: "تایمر",
  finishMode: "اولین نفر تمام می‌کند",
  timerDuration: "مدت زمان تایمر",
  seconds: "ثانیه",
  chooseLetter: "حرف را انتخاب کنید",
  randomLetter: "تصادفی",
  minCategories: "حداقل ۵ دسته‌بندی اضافه کنید.",
  copyCode: "کپی کد",
  codeCopied: "کپی شد!",
  shareCode: "این کد را با دوستان خود به اشتراک بگذارید",

  round: "راند",
  letter: "حرف",
  timeLeft: "زمان باقی‌مانده",
  iFinished: "تموم کردم!",
  someoneFinished: "راند را تمام کرد!",
  inputsLocked: "راند تمام شد — ورودی‌ها قفل شدند.",
  category: "دسته‌بندی",

  votingPhase: "مرحله رأی‌گیری",
  voteInstruction: "پاسخ‌هایی که فکر می‌کنید نادرست هستند را علامت بزنید.",
  invalid: "نادرست",
  valid: "درست",
  submitVotes: "ثبت رأی‌ها",
  yourAnswer: "جواب شما",
  noAnswer: "بدون جواب",

  scoreboard: "جدول امتیازات",
  score: "امتیاز",
  nextRound: "راند بعدی",
  endGame: "پایان بازی",
  pickLetter: "حرف راند بعدی را انتخاب کنید",
  pts: "امتیاز",
  unique: "منحصربه‌فرد",
  shared: "مشترک",
  empty: "خالی",

  gameOver: "بازی تمام شد",
  finalScores: "امتیازات نهایی",
  winner: "برنده",
  playAgain: "بازی مجدد",
  backHome: "بازگشت به خانه",

  needMorePlayers: "حداقل ۲ بازیکن برای شروع لازم است.",
  errorGeneric: "مشکلی پیش آمد. دوباره تلاش کنید.",
  sessionExpired: "نشست شما منقضی شده است. دوباره وارد شوید.",

  persianLetters: [],
  letters: [
    "الف","ب","پ","ت","ث","ج","چ","ح","خ","د",
    "ذ","ر","ز","ژ","س","ش","ص","ض","ط","ظ",
    "ع","غ","ف","ق","ک","گ","ل","م","ن","و","ه","ی"
  ],
};

export type TranslationKey = keyof typeof en;
export type Translations = typeof en;
