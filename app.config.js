// Melengkapi app.json dengan nilai rahasia dari environment (tidak ditulis di repositori).
// GOOGLE_MAPS_API_KEY diperlukan agar peta Google tampil di build Android.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...(config.android && config.android.config),
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY || '' },
    },
  },
});
