interface SchemaField {
  type: string;
  default?: unknown;
  properties?: Record<string, SchemaField>;
  required?: string[];
  items?: SchemaField;
}

export const simplifiedSchemas: Record<string, SchemaField> = {
  task: {
    type: 'object',
    properties: {
      description: { type: 'string' },
      prompt: { type: 'string' },
      subagent_type: { type: 'string' },
      run_in_background: { type: 'boolean', default: true },
      session_id: { type: 'string' },
    },
    required: ['prompt', 'subagent_type'],
  },
  write: {
    type: 'object',
    properties: {
      filePath: { type: 'string' },
      content: { type: 'string' },
    },
    required: ['filePath', 'content'],
  },
  edit: {
    type: 'object',
    properties: {
      filePath: { type: 'string' },
      oldString: { type: 'string' },
      newString: { type: 'string' },
      replaceAll: { type: 'boolean', default: false },
    },
    required: ['filePath', 'oldString', 'newString'],
  },
  ast_grep_replace: {
    type: 'object',
    properties: {
      pattern: { type: 'string' },
      rewrite: { type: 'string' },
      lang: { type: 'string' },
      paths: { type: 'array', items: { type: 'string' } },
      dryRun: { type: 'boolean', default: false },
    },
    required: ['pattern', 'rewrite', 'lang'],
  },
  todowrite: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            status: { type: 'string', default: 'pending' },
            priority: { type: 'string', default: 'medium' },
          },
          required: ['content'],
        },
      },
    },
    required: ['todos'],
  },
};
