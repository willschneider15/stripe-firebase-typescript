// Example Component Hooked up to Stripe

"use client";

import { useAuthContext } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActiveProducts, getAllProducts } from '@/stripe/products';
import { useRouter } from 'next/navigation';
import { Product } from '@/stripe/typings'
import createPortal  from '@/stripe/createPortal';
import createCheckoutSession from "@/stripe/createCheckoutSession"
import Spinner from "@/components/ui/Spinner"; // Import Spinner component

// Dynamically keeps track of all products properly setup and synced in Firebase
// Displays the state of each product:
// - One-time Payments: Buy Now or Paid
// - Subscriptions: Subscribe or Manage

export default function StripeTesting() {

    const [products, setProducts] = useState<Product[]>([]);
    const [activeProducts, setActiveProducts] = useState([""]);
    const [loading, setLoading] = useState(true); // Loading state
    const [buttonLoading, setButtonLoading] = useState<string | null>(null); // Single loading state for buttons
    const { user } = useAuthContext();
    const router = useRouter();
    const manageSubscription = async () => {
        if(user){
            setButtonLoading('manage');
            const portalUrl = await createPortal(user.uid);
            setButtonLoading(null);
            console.log("Manage Subscription");
            if (portalUrl) router.push(portalUrl); // Manage Subscription
        }
        else{
            console.log("User not logged in");
            router.push('/signup'); // User not logged in
        }
    };

    const createCheckout = async (priceId: string, type: string) => {
        if (user) {
            setButtonLoading(priceId);
            const checkoutUrl = await createCheckoutSession(priceId, user.uid, type);
            setButtonLoading(null); 
            console.log("Checkout session created");
            if (checkoutUrl) router.push(checkoutUrl); // But one-time or subscription product
        }
        else{
            console.log("User not logged in");
            router.push('/signup'); // User not logged in
        }
    };

    useEffect(() => {
        const initializeProducts = async () => {
        try {
            const [allProducts, userActiveProducts] = await Promise.all([
            getAllProducts(),
            getActiveProducts(),
            ]);
            console.log("All Products:", allProducts);
            setProducts(allProducts);
            console.log("Active Products:", userActiveProducts);
            setActiveProducts(userActiveProducts);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false); // Ensure loading is set to false after data fetch attempt
        }
        };

        initializeProducts();
    }, []);

    if (loading) {
        return <div></div>; // Could add loading spinner here
    }

    return (
            <Card className="m-5 md:m-10 p-10">
                <CardHeader>
                <CardTitle>All Stripe Products</CardTitle>
                <CardDescription>View all the products dynamically from stripe</CardDescription>
                </CardHeader>
                <CardContent>
                {products.map((product, index) => (
                    <div key={product.productId} className="grid gap-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg font-medium">{product.name}</p>
                                <p className="text-muted-foreground">
                                {/* You can display additional product details here if available */}
                                ${product.price} 
                                </p>
                            </div>
                            {activeProducts.includes(product.productId) ? (
                                product.type === "recurring" ? (
                                    <Button 
                                        variant="outline" 
                                        onClick={manageSubscription} 
                                        disabled={buttonLoading === 'manage'}
                                    >
                                    {buttonLoading === 'manage' ? <Spinner /> : "Manage"}
                                    </Button>
                                ) : (
                                    <p className="text-muted-foreground mx-8">Paid</p>
                                )
                            ) : (
                                <Button
                                    onClick={() => createCheckout(product.pricingId, product.type)}
                                    disabled={buttonLoading === product.pricingId}
                                >
                                    {buttonLoading === product.pricingId ? <Spinner /> : (product.type === "recurring" ? "Subscribe" : "Buy Now")}
                                </Button>
                            )}
                        </div>
                        {index < products.length - 1 && <hr />}
                    </div>
                    ))}
                </CardContent>
            </Card>

    );
}