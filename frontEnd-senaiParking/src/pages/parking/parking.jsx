import React, { useState, useEffect } from 'react';
import './parking.css'; // Import the new CSS file
import logo from '../../assets/logo-senai.png'; // Adjust the path to your logo if necessary
import BackButton from '../../components/BackButton/BackButton.jsx'; // Importa o componente de botão de voltar

const ParkingSpotsPage = () => {
    // State to hold the total number of parking spots (should match VAGAS_MAXIMAS from backend)
    const totalSpots = 10;
    // State to hold the number of currently available spots
    const [availableSpots, setAvailableSpots] = useState(0); // Initialize to 0, will be fetched from API
    // State for error message display
    const [errorMessage, setErrorMessage] = useState('');

    // useEffect to fetch real-time data from the backend API
    useEffect(() => {
        const fetchParkingSpotData = async () => {
            setErrorMessage(''); // Clear previous error messages
            try {
                // Get the authentication token from localStorage
                const authToken = localStorage.getItem('authToken');

                // Define headers for the fetch request, including Authorization if token exists
                const headers = {
                    'Content-Type': 'application/json',
                };
                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                } else {
                    // If no token, and it's a protected route, set an error message
                    setErrorMessage('Autenticação necessária para carregar vagas.');
                    setAvailableSpots(0); // No spots if not authenticated
                    return; // Stop execution if no token
                }

                // Make the API call to get available spots
                // The URL matches the backend endpoint provided: localhost:3000/api/garage/available-spots
                const response = await fetch('http://localhost:3000/api/garage/available-spots', {
                    method: 'GET', // Explicitly specify GET method
                    headers: headers, // Include the headers with Authorization token
                });

                if (!response.ok) {
                    // If the response is not OK (e.g., 401 Unauthorized, 404 Not Found, 500 Server Error), throw an error
                    const errorText = await response.text(); // Get raw response text for better debugging
                    let parsedError = { error: 'Erro desconhecido' };
                    try {
                        parsedError = JSON.parse(errorText); // Try to parse as JSON
                    } catch (e) {
                        // If not JSON, use the raw text
                        parsedError.error = errorText;
                    }
                    throw new Error(parsedError.error || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // Crucially, the backend returns { vagasDisponiveis: number },
                // so we need to access data.vagasDisponiveis
                setAvailableSpots(data.vagasDisponiveis);
            } catch (error) {
                console.error('Error fetching parking spot data:', error);
                setAvailableSpots(0); // Default to 0 available spots on error
                setErrorMessage(`Erro ao carregar vagas: ${error.message}`); // Display error to user
            }
        };

        fetchParkingSpotData();

        // Optional: Set up an interval to refresh the data periodically
        // This makes the display real-time without requiring a page refresh
        const intervalId = setInterval(fetchParkingSpotData, 5000); // Refresh every 5 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);

    }, []); // Empty dependency array means this runs once on mount and sets up interval

    // Function to render the individual parking spot squares
    const renderParkingSpots = () => {
        const spots = [];
        for (let i = 0; i < totalSpots; i++) {
            // Determine if the spot is available based on the availableSpots count
            // Spots are numbered 1 to 10, so if availableSpots is 5, spots 1-5 are green.
            const isAvailable = (i + 1) <= availableSpots;
            spots.push(
                <div
                    key={i} // Unique key for each element in a list
                    className={`parking-spot ${isAvailable ? 'available' : 'unavailable'}`}
                    title={`Vaga ${i + 1} está ${isAvailable ? 'disponível' : 'indisponível'}`}
                >
                    <span>{i + 1}</span> {/* Display spot numbers */}
                </div>
            );
        }
        return spots;
    };

    return (
        <div className="body-parking">
            <div className="parking-header">
    <img src={logo} alt="SENAI Logo" className="parking-logo" />
    <BackButton /> {/* Back button to navigate to the previous page */}
</div>
            <div className="parking-container">
                {/* Text displaying the number of available spots */}
                <h2 className="availability-text">
                    Vagas Disponíveis: {availableSpots} / {totalSpots}
                </h2>

                {/* Display error message if any */}
                {errorMessage && (
                    <div className="message-box error">
                        {errorMessage}
                    </div>
                )}

                {/* Grid container for the parking spots */}
                <div className="parking-grid">
                    {renderParkingSpots()}
                </div>
            </div>
        </div>
    );
};

export default ParkingSpotsPage;
