import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './App.css';

function NavBar() {
  const location = useLocation();

  return (
    <div className="nav-portal-menu">
      <div className="row">
        <div className="col-6 text-center">
          <Link to="/" className={`nav-portal-link${location.pathname === '/' ? ' active' : ''}`}>
            <span className="nav-portal-icon"></span>
            管制後台
          </Link>
        </div>
        <div className="col-6 text-center">
          <Link to="/validator" className={`nav-portal-link${location.pathname === '/validator' ? ' active' : ''}`}>
            <span className="nav-portal-icon"></span>
            驗證器
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NavBar;