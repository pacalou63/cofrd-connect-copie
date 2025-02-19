import React, { useState, useEffect } from 'react';
import './dashboard.css';
import activiteLogo from '../img/appointment.png';
import Main from './main';
import userLogo from '../img/people.png';
import userGrpLogo from '../img/group.png';
import logoutLogo from '../img/logout.png';
import cofrdLogo from '../img/cofrd-logo.png'; 
import petitPoints from '../img/more.png';
import dashboard from '../img/dashboard.png'; 
import { Line, Pie } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    LineElement, 
    PointElement, 
    LinearScale, 
    Title, 
    CategoryScale, 
    Tooltip, 
    Legend,
    ArcElement
} from 'chart.js';
import { fetchActivites } from '../services/api';
import UsersView from './usersView';

const Dashboard = ({ user, onLogout }) => {
    const [showMain, setShowMain] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [chartData, setChartData] = useState({ datasets: [] });
    const [activites, setActivites] = useState([]);
    const [showUsersView, setShowUsersView] = useState(false);
    const [pieChartData, setPieChartData] = useState({
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [],
            borderWidth: 1
        }]
    });
    const [prochainActivites, setProchainActivites] = useState([]);
    const [navbarOpen, setNavbarOpen] = useState(false);

    ChartJS.register(
        LineElement, 
        PointElement, 
        LinearScale, 
        Title, 
        CategoryScale,
        Tooltip, 
        Legend,
        ArcElement
    );

    const toggleUserInfo = () => {
        setShowUserInfo(!showUserInfo);
    };

    const toggleMain = () => {
        setShowMain(!showMain);
    };

    const toggleUsersView = () => {
        setShowUsersView(!showUsersView);
    };

    const toggleNavbar = () => {
        setNavbarOpen(!navbarOpen);
    };

    useEffect(() => {
        const getActivites = async () => {
            const data = await fetchActivites();
            console.log("Données reçues:", data);

            if (Array.isArray(data) && data.length > 0) {
                // Trier les activités par date
                const sortedActivites = [...data].sort((a, b) => 
                    new Date(a.date) - new Date(b.date)
                );

                setActivites(sortedActivites);
                
                const formattedData = {
                    labels: sortedActivites.map(activite => activite.libelleActivite),
                    datasets: [
                        {
                            label: 'Activités par date',
                            data: sortedActivites.map(activite => {
                                const date = new Date(activite.date);
                                
                                return {
                                    x: activite.libelleActivite,
                                    y: date.getMonth() + (date.getDate() / 31), 
                                    date: activite.date
                                };
                            }),
                            fill: false,
                            borderColor: '#3498db',
                            backgroundColor: '#3498db',
                            tension: 0.4,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                        },
                    ],
                };
                setChartData(formattedData);

                // Définir les villes spécifiques et leurs couleurs
                const villesSpecifiques = {
                    'Oshawa': '#FF6384',
                    'Toronto': '#36A2EB',
                    'Bowmanville': '#FFCE56',
                    'Whitby': '#4BC0C0',
                    'Scarborough': '#9966FF'
                };

                // Compter les activités par ville
                const villesCount = data.reduce((acc, activite) => {
                    // Pour chaque ville, vérifier si le lieu de l'activité contient le nom de la ville
                    Object.keys(villesSpecifiques).forEach(ville => {
                        if (activite.lieu.includes(ville)) {
                            acc[ville] = (acc[ville] || 0) + 1;
                        }
                    });
                    return acc;
                }, {});

                console.log("Comptage des villes:", villesCount);

                // S'assurer que toutes les villes sont présentes
                Object.keys(villesSpecifiques).forEach(ville => {
                    if (!villesCount.hasOwnProperty(ville)) {
                        villesCount[ville] = 0;
                    }
                });

                const pieData = {
                    labels: Object.keys(villesCount),
                    datasets: [{
                        data: Object.values(villesCount),
                        backgroundColor: Object.keys(villesCount).map(ville => villesSpecifiques[ville]),
                        borderWidth: 1
                    }]
                };

                console.log("Données du Pie Chart:", pieData);
                setPieChartData(pieData);

                // Récupérer les 3 prochaines activités
                const dateActuelle = new Date();
                const activitesAVenir = data
                    .filter(activite => {
                        const dateActivite = new Date(activite.date);
                        return dateActivite > dateActuelle;
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 3);

                setProchainActivites(activitesAVenir);
            }
        };

        getActivites();
    }, []);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                        family: "'Arial', sans-serif",
                        weight: 'bold',
                    },
                    color: '#2c3e50'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                titleColor: '#2c3e50',
                bodyColor: '#2c3e50',
                borderColor: '#e1e1e1',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        const date = new Date(context.raw.date);
                        date.setDate(date.getDate() + 1);
                        const options = { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        };
                        return `Date : ${date.toLocaleDateString('fr-FR', options)}`;
                    }
                }
            },
            title: {
                display: true,
                text: 'Activités dans le temps',
                font: {
                    size: 18,
                    weight: 'bold',
                },
                color: '#2c3e50'
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Activités',
                    font: {
                        size: 14,
                        weight: 'bold',
                        family: "'Arial', sans-serif"
                    },
                    color: '#2c3e50'
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    lineWidth: 1
                },
                ticks: {
                    font: {
                        size: 12,
                        family: "'Arial', sans-serif"
                    },
                    color: '#2c3e50',
                    padding: 10,
                    maxRotation: 45,
                    minRotation: 45,
                    autoSkip: false,
                }
            },
            y: {               
                title: {
                    display: true,
                    text: 'Mois',
                    font: {
                        size: 14,
                        weight: 'bold',
                        family: "'Arial', sans-serif"
                    },
                    color: '#2c3e50'
                },
                min: 0,
                max: 11,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    lineWidth: 1
                },
                ticks: {
                    callback: function(value) {
                        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                        return months[value];
                    },
                    stepSize: 0.5,
                    font: {
                        size: 12,
                        family: "'Arial', sans-serif"
                    },
                    color: '#2c3e50'
                }
            }
        },
        layout: {
            padding: {
                top: 20,
                right: 40,
                bottom: 20,
                left: 40
            }
        },
        animations: {
            tension: {
                duration: 1000,
                easing: 'linear',
                from: 0.5,
                to: 0,
                loop: true
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    font: {
                        size: 12,
                        family: "'Arial', sans-serif"
                    },
                    color: '#2c3e50',
                    padding: 20
                }
            },
            title: {
                display: true,
                text: 'Répartition par ville',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw;
                        const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} activité${value > 1 ? 's' : ''} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <div>
            {showMain ? (
                <Main user={user}/>
            ) : showUsersView ?(
                <UsersView user={user}/>
            ) : (
                <div className='main'>
                    <div className='container'>
                        <div className='header'>
                            <div className='navbarr'>                              
                                <div className='user'>
                                    <div className='line'></div>
                                    <div className='user-logo' >
                                        <img src={userLogo} alt="User" />
                                    </div>
                                    <div className='user-text'>
                                        <div className='user-info'>
                                            <h2>{user.username}</h2>
                                        </div>
                                    </div>
                                    <div className='petitPoints' onClick={toggleUserInfo}>
                                        <img src={petitPoints} alt="Points" />
                                    </div>
                                    {showUserInfo && (
                                        <div className='user-container'>
                                            <div className='logout'>
                                                <img src={logoutLogo} alt='logout' onClick={onLogout}/>
                                                <h2 className='logout-logo-text'>Se déconnecter</h2>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                

                                <div className='activite-paging'> 
                                    <div className='activite-logo' onClick={toggleMain}>
                                        <img src={activiteLogo} alt="activite-paging" />
                                        <h2 className='activite-logo-text'>Évenements</h2>
                                    </div>
                                </div>
                                <div className='dashboard-paging'> 
                                    <div className='dashboard-logo' >
                                        <img src={dashboard} alt="dashboard-paging" />
                                        <h2 className='dashboard-logo-text'>Tableau de bord</h2>
                                    </div>
                                </div>
                                <div className='users-paging'> 
                                    <div className='users-logo' onClick={toggleUsersView}>
                                        <img src={userGrpLogo} alt="users-paging" />
                                        <h2 className='users-logo-text'>Utilisateurs</h2>
                                    </div>
                                </div>
                            </div>                  
                        </div>
                        <div className='contentt'>
                            <div className='gauche'>
                                <div className='diagramme-container'>
                                    <div className='diagramme'>
                                        <div className='graphique'>
                                            <Line data={chartData} options={options}/>
                                        </div>
                                    </div>                             
                                </div>
                            </div>
                            
                            <div className='droite'>
                                <div className='case-container'> 
                                    <div className='class1-container'>
                                        <div className='class1'>
                                            <h3>Prochaines activités</h3>
                                            <div className='activites-list'>
                                                {prochainActivites.map((activite) => {
                                                    const date = new Date(activite.date);
                                                    date.setDate(date.getDate() + 1);
                                                    const options = { 
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    };
                                                    
                                                    return (
                                                        <div key={activite.idActivite} className='activite-item'>
                                                            <h4>{activite.libelleActivite}</h4>
                                                            <p className='activite-lieu'>{activite.lieu}</p>
                                                            <p className='activite-date'>
                                                                {date.toLocaleDateString('fr-FR', options)}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='class2-container'>
                                        <div className='class2' style={{ height: '200px', width: '100%' }}>
                                            <Pie 
                                                data={pieChartData} 
                                                options={pieOptions}
                                                height={200}
                                                width={200}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>             
                </div>
            )}
        </div>
    );
};

export default Dashboard;