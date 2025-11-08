// import React, { useState } from "react";
// import { signupUser } from "../api/authapi";
// import { useNavigate, Link } from "react-router-dom";

// function Signup() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     try {
//       await signupUser(name, email, password);
//       alert("Signup successful!");
//       navigate("/login");
//     } catch (err) {
//       alert("Signup failed");
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-200 relative">
//       {/* Top Bar */}
//       <div className="absolute top-6 left-8 text-2xl font-extrabold text-orange-600 tracking-wide">
//         CrowdGuard
//       </div>

//       {/* Center Form */}
//       <div className="flex flex-1 items-center justify-center px-4">
//         <form
//           onSubmit={handleSignup}
//           className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-100"
//         >
//           <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
//             Create Your Account
//           </h2>

//           <div className="mb-4">
//             <input
//               type="text"
//               placeholder="Full Name"
//               className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <input
//               type="email"
//               placeholder="Email"
//               className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </div>

//           <div className="mb-6">
//             <input
//               type="password"
//               placeholder="Password"
//               className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-all shadow-md"
//           >
//             Sign Up
//           </button>

//           <p className="text-sm text-gray-600 text-center mt-4">
//             Already have an account?{" "}
//             <Link
//               to="/login"
//               className="text-orange-600 hover:underline font-medium"
//             >
//               Log in
//             </Link>
//           </p>
//         </form>
//       </div>

//       {/* Footer */}
//       <div className="text-center text-gray-500 text-xs pb-4">
//         © {new Date().getFullYear()} CrowdGuard. All rights reserved.
//       </div>
//     </div>
//   );
// }

// export default Signup;
