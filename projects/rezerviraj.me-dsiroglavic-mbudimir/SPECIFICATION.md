# Project Specification: Rezerviraj.me

## Overview
Rezerviraj.me is a web platform that allows users to easily and quickly book various appointments and services online.

## Functional Requirements
- **Search and filter services**  
  Users can search for available services by name, category, or price.
- **View service details**  
  Each service has a detailed description, price, available time slots.
- **Book appointments**  
  Users can select an available time slot and confirm their reservation.
- **Manage reservations**  
  Users can view, modify, or cancel their bookings.
- **User accounts**  
  Registration, login, and profile management for users.
- **Administrative functionalities**  
  The admin can add, edit, or delete services and manage users and reservations.

## Non-Functional Requirements
- **Performance** – the system must respond quickly to user actions.  
- **Scalability** – the system should support an increasing number of users and services without performance loss.  
- **Security** – ensure the protection of user data and reservations.  
- **Reliability** – maintain high system availability and accurate information.  
- **User Experience** – intuitive, responsive interface optimized for all devices.

## System Diagram

graph TD
    User --> (Register/Login)
    User --> (Filter Services)
    User --> (View Service Details)
    User --> (Book Appointment)
    User --> (Manage Reservations)
    Admin --> (Manage Services)
    Admin --> (Manage Users)
    Admin --> (View All Reservations)
