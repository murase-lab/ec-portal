export default function Header({ title }) {
    return (
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#dbe4e6] flex items-center justify-between px-4 py-3 lg:ml-72 lg:w-[calc(100%-18rem)]">
            <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                    <span className="material-symbols-outlined text-[#111718]">menu</span>
                </button>
                <h1 className="text-[#111718] text-lg font-bold tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">notifications</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                    <img
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKs7GWYsXvg_hReN2JQSvoHGW1IASPYbyKk4pfyKS7lDgXqhpPgE0aNZdkeaXNqAFc2lg8g8yDxp_Z2FR4um25c21SoFGMrDVd3zkJ4nfc98XMZraE6WzGwF9xfjFZ1uHRtzA9FJfwDmvu2Mfm76UphVSVz-8fkzNVqILl9MeMMLPaquIzvKl6qoczTRtw5Rx8d1mTTeTAJBUp1meVhzVVV421PeGoHsACltwedz25Twz3U4_35uJr7l_B3a5i65KAa8Y33bGdt0-8"
                        alt="avatar"
                    />
                </div>
            </div>
        </header>
    )
}
