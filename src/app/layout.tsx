import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/nav";


const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AKS-Store",
  description: "An E-commerce Store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${robotoMono.variable}`}
    >
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <ToastContainer position="top-center" autoClose={2000} />
      </body>
    </html>
  );
}




//update profile page             done
//dont show brokwen image         done
//show nav bar in profile page    done
//add navbar in all pages         done
//add product in schema           done
// !type , catagory               done





//data seed in database                          done
//product api bna k data wahan se le lo          done
//product detail page through api                done
//profile pic upload (online storage)            done







//update schema 
//fix local cart issue
//checkout page
//order page 
//COD or card payment
//sandbox acc
//stripe or Tocheckout
//cart inidication in navbar(like 2 items in cart or 0 items in cart)





//products/product-PublicId/img with timestamp(same with profile and catagory images )  done
//hard del cart on checkout                                                             done
//continue shoopping button in success page
//manage loading 
//multi-images of products 
//admin can add products
//users role like admin or customer 
//admin should have different dashboard
//admin can manage products, orders, users
//listing of products through admin dashboard 



//admin can add category or remove 
//caterory/subcategory
//product detail image(can manage after upload and mini pics in page )
//placeholder in place of broken image 
//constraint on images while uploading if cloud give 500 error do not upload them(show error to admin )





//category page 
//product table (table)
//order page and (admin can update status and del orders)


//8/5/2025
//image validation (error boundary)
//listing page (redirect after add product)
//if payment done order could not be cancel
//if order delivered ststus should remain same (even admin cannot change it )
//enum(status)
//admin can manage users (delete and can change role, updated personal info)