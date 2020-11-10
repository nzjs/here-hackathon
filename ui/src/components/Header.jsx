import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';

class Header extends React.Component {
  render() {

    return (
      <Navbar variant='light' bg='light' expand='lg' sticky='top'>
        <Navbar.Toggle aria-controls='basic-navbar-nav' />
       
        <Navbar.Collapse id='basic-navbar-nav'>
          <span className='header-text text-dark'>GP / Health Analysis Tool</span>
          <Nav className='mr-auto'>
            <Nav.Link href='#'>&nbsp;</Nav.Link>
            <Nav.Link href='#'>A HERE Hackathon Project</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

export default Header;