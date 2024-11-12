import axios from 'axios';

interface BookContent {
  content: string;
  error?: string;
}

export async function fetchBookContent(url: string): Promise<BookContent> {
  try {
    // Use local proxy instead of direct CCEL access
    const response = await axios.get(`http://localhost:3001/api/fetch-content?url=${encodeURIComponent(url)}`);
    
    if (response.data.error) {
      return { content: '', error: response.data.error };
    }

    return { content: response.data.content };
  } catch (error) {
    console.error('Error fetching book content:', error);
    return { content: '', error: 'Failed to fetch content' };
  }
}

export function getNextPageUrl(currentUrl: string, pageNumber: number): string {
  return currentUrl.replace('.html', `.${pageNumber}.html`);
}

export function getPreviousPageUrl(currentUrl: string, pageNumber: number): string {
  if (pageNumber <= 1) {
    return currentUrl;
  }
  return currentUrl.replace('.html', `.${pageNumber}.html`);
}