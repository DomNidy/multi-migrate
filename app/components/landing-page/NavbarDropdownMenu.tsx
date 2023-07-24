"use client";
import { useState } from "react";
import { BiMenu } from "react-icons/bi";
import { AiOutlineClose } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";

export default function NavbarDropdownMenu({
  firebaseUser,
}: {
  firebaseUser: User | undefined;
}) {
  const router = useRouter();
  // If the dropdown menu is displayed
  const [isActive, setIsActive] = useState<boolean>(false);
  return (
    <div>
      <BiMenu
        className="scale-100 text-3xl md:scale-0 cursor-pointer "
        onClick={() => setIsActive(!isActive)}
      />

      <div
        className={`fixed flex flex-row-reverse bg-white top-0 right-0 w-full h-0 transition-all  ${
          isActive ? "h-56" : "h-0"
        }`}
      >
        <AiOutlineClose
          className={`text-3xl mt-[0.66rem] mr-[0.47rem] z-10 transition duration-100 scale-y-0 ${
            isActive ? "scale-y-100" : ""
          }`}
          onClick={() => setIsActive(!isActive)}
        />

        <div
          className={`w-full flex flex-col p-3 fixed pt-10 items-center ${
            isActive ? "visible" : "invisible"
          }`}
        >
          <div
            className={`bg-white p-[0.45rem] w-2/3 cursor-pointer transition-all opacity-0 scale-y-0 duration-[125ms] active:bg-neutral-300 rounded-lg shadow-inner ${
              isActive ? "opacity-100 scale-y-100" : ""
            }`}
          >
            <h2 className="text-center">Features</h2>
          </div>
          <div
            className={`bg-white p-[0.45rem] w-2/3 cursor-pointer transition-all opacity-0 scale-y-0 duration-[125ms] active:bg-neutral-300 rounded-lg shadow-inner ${
              isActive ? "opacity-100 scale-y-100" : ""
            }`}
          >
            <h2 className="text-center">Platforms</h2>
          </div>
          <div
            className={`bg-white p-[0.45rem] w-2/3 cursor-pointer transition-all opacity-0 scale-y-0 duration-[125ms] active:bg-neutral-300 rounded-lg shadow-inner ${
              isActive ? "opacity-100 scale-y-100" : ""
            }`}
          >
            <h2 className="text-center">Support</h2>
          </div>
          <div
            className={`bg-white p-[0.45rem] w-2/3 cursor-pointer transition-all opacity-0 scale-y-0 duration-[125ms] active:bg-neutral-300 rounded-lg shadow-inner ${
              isActive ? "opacity-100 scale-y-100" : ""
            }`}
          >
            {firebaseUser ? (
              <h2
                className="text-center"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </h2>
            ) : (
              <h2 className="text-center" onClick={() => router.push("/login")}>
                Login
              </h2>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}