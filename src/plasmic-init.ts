import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "2qM8YZaLjuLDEx2PqwyznS",  // The Pitch Fund project ID
      token: "ItfEeIGwJFIvc767YTCBqLRYBRMZgNcyhXA4l97i43Z5q2TdyK49t5ttnIkw8fvcl8SZvLUqxC2BgaIlnmGg",  // API token
    }
  ],
  // Fetches the latest revisions, whether or not they were unpublished!
  // Disable for production to ensure you render only published changes.
  preview: true,
}); 