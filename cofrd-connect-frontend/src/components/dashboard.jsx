import React, { useState, useEffect } from 'react';
import './dashboard.css';
import activiteLogo from '../img/appointment.png';
import Main from './main';
import userLogo from '../img/people.png';
import userGrpLogo from '../img/group.png';
import logoutLogo from '../img/logout.png';
import cofrdLogo from '../img/cofrd-logo.webp'; 
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
import messageIcon from '../img/message.png';
import Messagerie from './messagerie';

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
    const [showMessagerie, setShowMessagerie] = useState(false);

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

    const toggleMessagerie = () => {
        setShowMessagerie(!showMessagerie);
    }

    const handleLogout = () => {
        console.log("Tentative de déconnexion");
        localStorage.removeItem('currentUser');
        if (onLogout) {
            onLogout();
        }
        // Forcer le rechargement de la page
        window.location.reload();
    };

    useEffect(() => {
        const getActivites = async () => {
            const data = await fetchActivites();
            console.log("Données reçues:", data);

            if (Array.isArray(data) && data.length > 0) {
                const sortedActivites = [...data].sort((a, b) => 
                    new Date(a.date) - new Date(b.date)
                );

                setActivites(sortedActivites);
                
                // Ajout de vérifications pour éviter les undefined
                const formattedData = {
                    labels: sortedActivites.map(activite => activite?.libelleActivite || ''),
                    datasets: [
                        {
                            label: 'Activités par date',
                            data: sortedActivites.map(activite => {
                                if (!activite || !activite.date) return null;
                                const date = new Date(activite.date);
                                
                                return {
                                    x: activite.libelleActivite || '',
                                    y: date.getMonth() + (date.getDate() / 31), 
                                    date: activite.date
                                };
                            }).filter(Boolean), // Filtrer les valeurs null
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

                // Prochaines activités
                const today = new Date();
                const prochains = sortedActivites
                    .filter(activite => {
                        if (!activite || !activite.date) return false;
                        const activiteDate = new Date(activite.date);
                        return activiteDate >= today;
                    })
                    .slice(0, 5);
                setProchainActivites(prochains);

                // Configuration du pieChart pour les villes spécifiques
                const villes = {
                    'Oshawa': '#FF6384',
                    'Scarborough': '#36A2EB',
                    'Bowmanville': '#FFCE56',
                    'Toronto': '#4BC0C0',
                    'Whitby': '#9966FF'
                };

                const villesCount = {};
                sortedActivites.forEach(activite => {
                    if (activite && activite.lieu) {
                        Object.keys(villes).forEach(ville => {
                            if (activite.lieu.includes(ville)) {
                                villesCount[ville] = (villesCount[ville] || 0) + 1;
                            }
                        });
                    }
                });

                const pieData = {
                    labels: Object.keys(villesCount),
                    datasets: [{
                        data: Object.values(villesCount),
                        backgroundColor: Object.keys(villesCount).map(ville => villes[ville]),
                        borderWidth: 1
                    }]
                };
                setPieChartData(pieData);
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
            {showMessagerie ? (
                <Messagerie user={user}/>
            ) : showMain ? (
                <Main user={user}/>
            ) : showUsersView ? (
                <UsersView user={user}/>
            ) : (
                <div className='main'>
                    <div className='container'>
                        <div className='header'>
                            <div className='navbarr'>
                                <div className='cofrd'>
                                    <div className='cofrd-logo'>
                                        <img src={cofrdLogo} alt="cofrd"/>
                                        <h2 className='cofrd-logo-text'>Connect</h2>
                                    </div>
                                    <div className='line'></div>  
                                </div>  
                                                          
                                <div className='user'>
                                    
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
                                            <div className='logout-dashboard' onClick={handleLogout}>
                                                <img src={logoutLogo} alt='logout'/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className='paging'>
                                    
                                    <div className='dashboard-paging'> 
                                        <div className='dashboard-logo'>
                                            <img src={dashboard} alt="dashboard-paging" />
                                            <h2 className='dashboard-logo-text active'>Tableau de bord</h2>
                                        </div>
                                    </div>
                                    <div className='activite-paging'> 
                                        <div className='activite-logo' onClick={toggleMain}>
                                            <img src={activiteLogo} alt="activite-paging" />
                                            <h2 className='activite-logo-text'>Événements</h2>
                                        </div>
                                    </div>
                                    {user.admin === 1 && (
                                        <div className='users-paging'> 
                                            <div className='users-logo' onClick={toggleUsersView}>
                                                <img src={userGrpLogo} alt="users-paging" />
                                                <h2 className='users-logo-text'>Utilisateurs</h2>
                                            </div>
                                        </div>
                                    )}
                                    <div className='messagerie-paging'> 
                                        <div className='messagerie-logo' onClick={toggleMessagerie}>
                                            <img src={messageIcon} alt="messagerie-paging" />
                                            <h2 className='messagerie-logo-text'>Messagerie</h2>
                                        </div>
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