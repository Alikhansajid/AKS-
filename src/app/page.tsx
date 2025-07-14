export default function HOME() {
  return (
   <div className="bg-blue-600 min-h-screen font-[var(--font-geist-sans)]">
      {}
      <header className="bg-blue-700 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white"><a href="">AKS-Store</a></h1>
        <nav className="flex gap-4">
          <a href="" className="text-white hover:text-blue-200">
            Shop
          </a>
          <a href="" className="text-white hover:text-blue-200">
            About
          </a>
          <a href="/login" className="text-white hover:text-blue-200">
            Login
          </a>
          <a href="/signup" className="text-white hover:text-blue-200">
            Sign Up
          </a>
        </nav>
      </header>

      {}
      <section className="flex flex-col items-center justify-center text-center p-8 min-h-[50vh]">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Discover Amazing Products
        </h2>
        <p className="text-lg text-blue-100 mb-6 max-w-lg">
          Shop the latest trends and exclusive deals at unbeatable prices. Your
          one-stop e-commerce store awaits!
        </p>
        <a
          href=""
          className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-400 transition-colors"
        >
          Shop Now
        </a>
      </section>

      {}
      <section className="bg-blue-100 py-12 px-8">
        <h3 className="text-3xl font-bold text-blue-600 text-center mb-8">
          Featured Products
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <div className="bg-blue-200 h-48 mb-4 rounded" />
              <h4 className="text-xl font-semibold text-blue-600">
                Product {item}
              </h4>
              <p className="text-blue-500 mb-4">
                High-quality item at an amazing price.
              </p>
              <a
                href=""
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
              >
                View Details
              </a>
            </div>
          ))}
        </div>
      </section>

     {}
      <footer className="bg-blue-700 p-4 text-center text-white">
        <p> 2025 AKS-Store. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="" className="text-blue-200 hover:text-white">
            Terms
          </a>
          <a href="" className="text-blue-200 hover:text-white">
            Privacy
          </a>
          <a href="" className="text-blue-200 hover:text-white">
            Contact
          </a>
        </div>
      </footer>
    </div>
    
  );
}
