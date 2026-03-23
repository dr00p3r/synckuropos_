
const API_URL = import.meta.env.VITE_SYNC_SERVER_URL;

export const telemetryService = {

    async getAllLogs(): Promise<any[]> {
        const response = await fetch(`${API_URL}/api/telemetry`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch telemetry logs');
        }
        return await response.json();
    }
};
