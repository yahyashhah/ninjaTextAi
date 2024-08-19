import { NextResponse } from "next/server";


const admin_username = process.env.admin_username
const admin_password = process.env.admin_password

export async function POST(req: Request) {
  try {

    const body = await req.json();
    const { username, password } = body;

    if(username != admin_username || password != admin_password){
        return NextResponse.json(false, { status: 404 });
    }
    
    return NextResponse.json(true, { status: 200 });
  } catch (error) {
    console.log("[ADMIN_LOGIN_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
