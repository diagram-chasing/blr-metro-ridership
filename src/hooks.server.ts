
export async function handle({ event, resolve }) {
  const analyticsId = "blr-metro-ridership";
  const baseUrl = "https://blr-metro-ridership.netlify.app";
  if (import.meta.env.PROD && analyticsId) {
    event.locals.analyticsID = analyticsId;
  }

  return resolve(event, {
    transformPageChunk: ({ html }) => {
      return html
        .replace('%baseURL%', event.locals.baseURL || '')
        .replace('%analyticsID%', event.locals.analyticsID || '');
    }
  });
}