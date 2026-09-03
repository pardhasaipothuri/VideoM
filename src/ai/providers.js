export const AIProvider = {
  async generateImage(_prompt,_options={}) { throw new Error('No image AI provider configured.'); },
  async generateVoice(_text,_options={}) { throw new Error('No voice AI provider configured.'); },
  async generateMusic(_prompt,_options={}) { throw new Error('No music AI provider configured.'); },
  async generateScript(_idea,_options={}) { throw new Error('No script AI provider configured.'); },
  async generateScene(_scene,_options={}) { throw new Error('No scene AI provider configured.'); }
};
export const createAIProvider = (implementation={}) => ({...AIProvider,...implementation});
