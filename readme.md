# **AI-Powered Surveillance System**

---

## **System Architecture Overview**

### **Frontend (React)**

* Real-time Security Alerts Dashboard
* Organization Management Interface
* Role-Based Access Control (RBAC)
* Auth0 Authentication Integration

### **Main Backend (Express + MongoDB)**

* RESTful API Endpoints
* JWT-Based Authentication
* Email Service for Organization Invites
* Firebase Integration for Real-Time Alerts

### **Agentic Backend (Django + Kafka)**

* Video Stream Processing
* Google Gemini AI Integration
* LangGraph-Based Security Monitoring
* Real-Time Alert Generation

---

## **Tech Stack**

### **Frontend**

* **Framework:** React + Vite
* **Styling:** TailwindCSS
* **State Management:** Redux Toolkit
* **Authentication:** Auth0 React SDK

### **Main Backend**

* **Runtime:** Node.js + Express
* **Database:** MongoDB
* **Authentication:** Auth0 Integration
* **Email Service:** Nodemailer

### **Agentic Backend**

* **Framework:** Django
* **Message Broker:** Apache Kafka
* **AI & Workflow:** LangGraph + Google Gemini API
* **Realtime Communication:** Firebase SDK

---

## **Key Features**

* AI-Powered Incident Detection
* Real-Time Security Alerts
* Multi-Organization Support
* Role-Based Access Control (RBAC)
* Automated Incident Management
* Email Notifications for Alerts & Invites

---

## **Authentication Flow**

1. User authenticates through **Auth0**.
2. Auth0 returns an **Access Token**.
3. Access Token is validated via **Backend Middleware**.
4. User data is synced with the **MongoDB Database**.
5. Session is maintained using a **JWT** mechanism.

---

## **Team Members**

| Name                  | Role        |
| --------------------- | ----------- |
| **Naman Sethi**       | Team Leader |
| **Aayush Kumar Bhat** | Developer   |
| **Ananya Aggarwal**   | Developer   |

---


