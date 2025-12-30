import { useRef, useEffect } from 'react';

interface UseBarcodeScannerProps {
    onScanned: (code: string) => void;
}

export const useBarcodeScanner = ({ onScanned }: UseBarcodeScannerProps) => {
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);
    
    // ms entre teclas (los escáneres son muy rápidos)
    const BARCODE_DELAY = 50;
    const MIN_LENGTH = 3; 

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime.current;

            // Si pasa mucho tiempo, reseteamos el buffer (es un humano escribiendo lento)
            if (timeDiff > BARCODE_DELAY) {
                buffer.current = '';
            }

            lastKeyTime.current = currentTime;

            // Si es Enter, verificamos si tenemos un código válido en el buffer
            if (e.key === 'Enter') {
                if (buffer.current.length >= MIN_LENGTH) {
                    e.preventDefault();
                    onScanned(buffer.current);
                    buffer.current = '';
                }
                return;
            }
            
            if (e.key.length === 1) {
                buffer.current += e.key;
            }
        };

        // Escuchamos en todo el documento para que el escáner funcione
        // incluso si el input perdió el foco momentáneamente
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onScanned]);
};