import type { Metadata } from "next";
import MarketHome from "../MarketHome";
export const metadata: Metadata = {title:"PaseSpain · Designvorschau", robots:{index:false,follow:false}};
export default function Page(){return <MarketHome preview/>;}
