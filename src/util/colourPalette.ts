export interface palette {
    complementary:[number,number,number],
    third_hue:[number,number,number],
    fourth_hue:[number,number,number],
    fifth_hue:[number,number,number]
}

export function analogous(h:number,s:number,l:number) {
    const res:palette = {
    complementary: [(h+30) %360,s,l],
    third_hue:[(h-30)%360,s,l],
    fourth_hue:[(h+60)%360,s,l],
    fifth_hue:[(h-60)%360,s,l]}
    return res
}
export function tetratic(h:number,s:number,l:number) {
    const res:palette ={
        complementary: [(h+180) %360,s,l],
        third_hue:[(h-90)%360,s,l],
        fourth_hue:[(h+270)%360,s,l],
        fifth_hue:[h,s*0.8,Math.min(l*1.2,100)]
    }
    return res
}

export function monochromatic(h:number,s:number,l:number) {
    const res:palette ={
        complementary: [(h+180) %360,s,l],
        third_hue:[h,s*0.9,l],
        fourth_hue:[h,s*0.8,l],
        fifth_hue:[h,s*0.7,l]
    }
    return res
}