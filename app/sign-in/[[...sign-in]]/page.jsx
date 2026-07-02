
import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f0f17]">
            <SignIn appearance={{
                elements: {
                    rootBox: "mx-auto",
                    card: "bg-[#1c1c29] border border-white/10",
                    headerTitle: "text-white",
                    headerSubtitle: "text-white/60",
                    socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white",
                    formFieldLabel: "text-white/60",
                    formFieldInput: "bg-[#0f0f17] border-white/10 text-white",
                    footerActionLink: "text-[#9B6BFF] hover:text-[#8A5CF5]",
                    formButtonPrimary: "bg-[#9B6BFF] hover:bg-[#8A5CF5] text-white",
                }
            }} />
        </div>
    );
}
