
const API_URL = 'http://localhost:3000/api'; // Adjust based on env in real app

export const telemetryService = {

    async getAllLogs(): Promise<any[]> {
        const response = await fetch(`${API_URL}/telemetry`, {
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
