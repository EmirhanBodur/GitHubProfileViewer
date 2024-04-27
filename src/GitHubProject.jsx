import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MdInsertLink } from 'react-icons/md';
import { AiOutlineStar } from 'react-icons/ai';
import { FaTrash, FaEye } from 'react-icons/fa';
import { languageColors } from './colors';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './GitHubProjects.css';

const GitHubProjects = () => {
  const myElementRef = useRef(null)
  const [inputValue, setInputValue] = useState('');
  const [user, setUser] = useState({});
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isProfileUpdated, setIsProfileUpdated] = useState(false);
  const [favoriteUsers, setFavoriteUsers] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const githubToken = process.env.REACT_APP_GITHUB_TOKEN;

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);

    axios
      .get(`https://api.github.com/search/users?q=${value}`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      })
      .then((response) => {
        
        const users = response.data.items.map((item) => ({
          username: item.login,
          avatarUrl: item.avatar_url,
          name: item.login,
        }));
        setSuggestedUsers(users);
      })
      .catch((error) => {
        console.error('GitHub kullanıcı adı önerileri alınamadı:', error);
        
        if(error.response && error.response.status === 422) {
          console.log('Lütfen geçerli bir kullanıcı adı giriniz');
        } else {
          console.log('GitHub kullanıcı adı önerileri alınamadı. Lütfen tekrar deneyiniz.')
        }
        setSuggestedUsers([]);
      });
  };

  const handleUsernameSelect = (username) => {
    setInputValue(username);
    setSuggestedUsers([]);
    setIsProfileVisible(true);
    setIsProfileUpdated(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get(`https://api.github.com/users/${inputValue}`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        });
  
        setUser({
          id: userResponse.data.id,
          name: userResponse.data.name || userResponse.data.login,
          avatarUrl: userResponse.data.avatar_url,
        });
  
        const response = await axios.get(`https://api.github.com/users/${inputValue}/repos`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        });
  
        const githubProjects = response.data.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          stars: project.stargazers_count,
          language: project.language,
        }));
  
        const sortedProjects = githubProjects.sort((a, b) => b.stars - a.stars);
  
        setProjects(sortedProjects);
        setError(null);
      } catch (error) {
        console.error('GitHub verileri alınamadı:', error);
        setProjects([]);
        setError('GitHub verileri alınamadı.');
      }
    };
  
    if (isProfileUpdated) {
      fetchData();
      setIsProfileUpdated(false);
    }
  }, [isProfileUpdated, inputValue, githubToken]);
  

  const addFavoriteUser = () => {
    const existingFavorites = JSON.parse(localStorage.getItem('favoriteUsers')) || [];

    if (existingFavorites.some((fav) => fav.username === user.name)) {
      setIsFavorite(true);
      return;
    }

    const newFavorite = {
      username: user.name,
      avatarUrl: user.avatarUrl,
      name: user.name,
    };
    const updatedFavorites = [...existingFavorites, newFavorite];
    localStorage.setItem('favoriteUsers', JSON.stringify(updatedFavorites));
    setFavoriteUsers(updatedFavorites);
    setIsFavorite(true);
  };

  const removeFavoriteUser = (username) => {
    const updatedFavorites = favoriteUsers.filter((fav) => fav.username !== username);
    localStorage.setItem('favoriteUsers', JSON.stringify(updatedFavorites));
    setFavoriteUsers(updatedFavorites);
  };

  useEffect(() => {
    const existingFavorites = JSON.parse(localStorage.getItem('favoriteUsers')) || [];
    setFavoriteUsers(existingFavorites);
    setIsFavorite(existingFavorites.some((fav) => fav.username === user.name));
  }, [user]);



  return (
    <div className="bg-cover bg-stone-400 bg-center min-h-screen flex items-center justify-center relative">
      <div className="w-full max-w-screen-xl bg-white p-8 rounded-lg shadow-lg relative">
        <h2 className="text-3xl font-bold text-black mb-6">GitHub Projeleri</h2>
        {isProfileVisible && (
          <div className="flex items-center mb-6">
            <img className="w-16 h-16 rounded-full mr-4 border-4 border-white" src={user.avatarUrl} alt="GitHub Avatar" />
            <div>
              <p className="text-2xl font-semibold text-gray-800">{user.name}</p>
              <button onClick={addFavoriteUser} disabled={isFavorite}>
             
                {isFavorite ? 'Favoride Ekli' : 'Favoriye Ekle'}
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="GitHub Kullanıcı Adı"
            className="border border-solid border-black p-2 w-full rounded pr-8"
            value={inputValue}
            onChange={handleInputChange}
          />
          {inputValue && (
            <button
              className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
              onClick={() => setInputValue('')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {suggestedUsers.length > 0 && (
            <ul className="mt-2 border-t border-gray-300">
              {suggestedUsers.map((user) => (
                <li
                  key={user.username}
                  className="cursor-pointer p-2 hover:bg-gray-200 flex items-center"
                  onClick={() => handleUsernameSelect(user.username)}
                >
                  <img src={user.avatarUrl} alt={`Avatar for ${user.username}`} className="w-8 h-8 rounded-full mr-2" />
                  {user.username}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300 z-10 text-black">
              <div className="flex items-center mb-4">
                <MdInsertLink className="text-2xl text-gray-500 mr-2" />
                <a
                  href={`https://github.com/${inputValue}/${project.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-gray-800 hover:underline"
                >
                  {project.name}
                </a>
              </div>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex items-center">
                <AiOutlineStar className="text-yellow-500 mr-1" />
                <p className="text-gray-700">{project.stars}</p>
                <div
                  className={`w-3 h-3 rounded-full ${languageColors[project.language] || 'bg-gray-300'} ml-auto`}
                ></div>
                <p className="text-gray-700 ml-1">{project.language}</p>
              </div>
            </div>
          ))}
        </div>

        {isProfileVisible && (
          <button
            className="mt-4 bg-white border border-gray-300 text-gray-700 py-2 px-6 rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 transition duration-300 cursor-pointer"
            onClick={() => window.open(`https://github.com/${inputValue}?tab=repositories`, '_blank')}
          >
            Tüm Repoları Gör
          </button>
        )}

        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">Favori GitHub Kullanıcıları</h3>
          <TransitionGroup>
            {favoriteUsers.map((favUser) => (
              <CSSTransition key={favUser.username} timeout={500} classNames="slide" nodeRef={myElementRef}>
                <div className="flex items-center justify-between bg-gray-100 p-4 rounded mb-4">
                  <div className="flex items-center">
                    <img
                      src={favUser.avatarUrl}
                      alt={`Avatar for ${favUser.username}`}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <div className="flex-grow">
                      <p className="text-lg font-semibold">{favUser.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => window.open(`https://github.com/${favUser.username.replace(/\s/g, '')}`, '_blank')}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => removeFavoriteUser(favUser.username)}
                      className="text-red-500 hover:underline"
                      style={{ fontSize: '1rem' }}
                    >
                      <FaTrash className="inline-block" />
                    </button>
                  </div>
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        </div>

        <footer className="mt-8 text-black text-center">
          <p>
            Bu site{' '}
            <a
              href="https://emirhanbodur.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline"
            >
              Emirhan Bodur
            </a>{' '}
            tarafından yapılmıştır
          </p>
        </footer>
      </div>
    </div>
  );
};

export default GitHubProjects;
