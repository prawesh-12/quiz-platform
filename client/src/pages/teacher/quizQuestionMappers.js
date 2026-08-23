const DEFAULT_POINTS = 1;

function buildOptions(source) {
  const options = [
    { key: "a", value: source.option_a || "" },
    { key: "b", value: source.option_b || "" },
  ];

  if (source.option_c) {
    options.push({ key: "c", value: source.option_c });
  }

  if (source.option_d) {
    options.push({ key: "d", value: source.option_d });
  }

  return options;
}

export function createEmptyQuestion() {
  return {
    id: crypto.randomUUID(),
    question_text: "",
    options: [
      { key: "a", value: "" },
      { key: "b", value: "" },
    ],
    correct_option: "a",
    points: DEFAULT_POINTS,
    has_equation: false,
    allow_multiple_answers: false,
    is_required: true,
  };
}

export function mapBackendQuestionToBuilder(question) {
  return {
    id: String(question.id),
    question_text: question.question_text,
    options: buildOptions(question),
    correct_option: question.correct_option,
    points: question.points || DEFAULT_POINTS,
    has_equation: Boolean(question.has_equation),
    allow_multiple_answers: Boolean(question.allow_multiple_answers),
    is_required: Boolean(question.is_required),
  };
}

export function mapImportedQuestionToBuilder(question) {
  return {
    ...mapBackendQuestionToBuilder(question),
    id: crypto.randomUUID(),
    unit_id: null,
    new_unit_name: null,
    in_subject_bank: false,
  };
}

export function mapPreviewQuestion(question) {
  return {
    id: String(question.id),
    question_text: question.question_text,
    options: buildOptions(question),
    correct_option: question.correct_option,
  };
}

export function mapBuilderQuestionToApi(question) {
  const optionsMap = Object.fromEntries(question.options.map((option) => [option.key, option.value]));

  return {
    question_text: question.question_text,
    option_a: optionsMap.a || "",
    option_b: optionsMap.b || "",
    option_c: optionsMap.c || null,
    option_d: optionsMap.d || null,
    correct_option: question.correct_option,
    points: Number(question.points || DEFAULT_POINTS),
    has_equation: Boolean(question.has_equation),
    allow_multiple_answers: Boolean(question.allow_multiple_answers),
    is_required: Boolean(question.is_required),
    unit_id: question.unit_id || null,
    new_unit_name: question.new_unit_name || null,
    in_subject_bank: Boolean(question.in_subject_bank),
  };
}
