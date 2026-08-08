export default function ExpiryBadge({
  order
}: any) {


  const formatDate = (date?: string) => {

    if (!date) return null;

    const d = new Date(date);

    const day = d.getUTCDate()
      .toString()
      .padStart(2, "0");

    const month = (d.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0");

    const year = d.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };



  const domainDate = formatDate(order.expiryDate);

const msofficeDates = (order.Plans || [])
  .filter(
    (plan: any) =>
      plan.type?.toLowerCase() === "msoffice"
  )
  .map(
    (plan: any) =>
      formatDate(plan.expiryDate)
  )
  .filter(Boolean);

  const emailDates = (order.Plans || [])
    .filter(
      (plan:any)=>plan.type === "email"
    )
    .map(
      (plan:any)=>formatDate(plan.expiryDate)
    )
    .filter(Boolean);



  const isSameExpiry =
    !!domainDate &&
    emailDates.length > 0 &&
    emailDates.every(
      (d:any)=>d === domainDate
    );



  const badgeBase =
    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit";


  const iconBase =
    "w-4 h-4 flex justify-center items-center rounded-full bg-white text-black text-[9px]";



  return (

    <div className="flex flex-col gap-1">


      {
        isSameExpiry &&
        domainDate &&

        <div
          className={`${badgeBase} bg-green-100 text-green-800`}
        >
          <span className={iconBase}>
            DE
          </span>

          {domainDate}

        </div>
      }




      {
        !isSameExpiry &&

        emailDates.map(
          (date:any,index:number)=>(

          <div
            key={index}
            className={`${badgeBase} bg-blue-100 text-blue-800`}
          >

            <span className={iconBase}>
              E
            </span>

            {date}

          </div>

        ))

      }




      {
        !isSameExpiry &&
        domainDate &&

        <div
           className={`${badgeBase} bg-green-100 text-green-800`}
        >

          <span className={iconBase}>
            D
          </span>

          {domainDate}

        </div>
      }

{
  !domainDate &&
  emailDates.length === 0 &&
  msofficeDates.map(
    (date: any, index: number) => (
      <div
        key={`msoffice-${index}`}
        className={`${badgeBase} bg-purple-100 text-purple-800`}
      >
        <span className={iconBase}>
          M
        </span>

        {date}
      </div>
    )
  )
}

      {
        !domainDate &&
        msofficeDates.length === 0 &&
        emailDates.length===0 &&

       <div
 className={`${badgeBase} bg-gray-200 text-gray-500 min-w-[100px]`}
  >
    <span className={iconBase}>
      -
    </span>

    N/A

  </div>
      }


    </div>

  );

}