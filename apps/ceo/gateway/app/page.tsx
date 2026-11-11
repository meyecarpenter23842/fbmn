import {redirect} from "next/navigation";
/** DL12D will copy the approved Flutter build to public/ceo before deployment. */
export default function Page(){redirect("/ceo/index.html");}
