import axiosClient from '../axiosClient';

export const generateCode = async (dsaType, language, prompt) => {
  const response = await axiosClient.post('/dsa/generate-code', {
    dsaType,
    language,
    prompt,
  });
  return response;
};
