<script>
  import PixelScreen from '$lib/components/pixel-screen.svelte';
  import OneTravelerDemo from '$charts/RidershipScaleComparison.svelte';
  import RidershipSampleTable from '$charts/RidershipDataTable.svelte';
  import DifferenceHourlyRidership from '$charts/HourlyRidershipComparison.svelte';
  import Rankings from '$charts/RoutePopularityRanking.svelte';
  import MetroMap from '$charts/InteractiveMetroMap.svelte';
  // import LanduseMetroMap from '$charts/LandUseHexagonOverlay.svelte';
  import YellowLine from '$charts/LineExpansionImpactAnalysis.svelte';
  import InterchangeFootfall from '$charts/InterchangeFootfall.svelte';
  import TreeMap from '$charts/StationFlowTreemap.svelte';
  import WeekdayWeekendVariation from '$charts/WeekendWeekdayRatio.svelte';
  import StationTooltip from '$lib/components/StationTooltip.svelte';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte.ts';
  import SpikeGraphic from '$charts/EventImpactTimeline.svelte';
  import AverageTripLength from '$charts/TravelTimeComparison.svelte';
  import HourlyRidershipHeatmap from '$charts/Heatmap.svelte';

  import Email from '$charts/RTIApplicationThread.svelte';
  import Network from '$charts/StationNetworkGraph.svelte';
  const isMobile = new IsMobile();
</script>

On 10th August 2025, Bangalore's Yellow Line metro was inaugurated, connecting <StationTooltip station="RV Road">RV Road</StationTooltip> to <StationTooltip station="Bommasandra">Bommasandra</StationTooltip>, and serving the major tech hub of <StationTooltip station="Electronic City">Electronic City</StationTooltip>. A week later, we filed a Right to Information (RTI) request with the Bangalore Metro Rail Corporation Limited (BMRCL) for data on hourly ridership at each station, from August 1st to 18th.

<Email/>

A month later, BMRCL responded with the requested data. The data includes over 1.2 million rows of data, detailing the number of passengers between each pair of metro stations, at each hour of the day, on each of 18 different days. Here's a sample of what the data looks like.

<RidershipSampleTable/>

The timing of the data captures the impact of the eagerly awaited (and much delayed) Yellow Line. Before the Yellow Line, the city's network consisted of the west-east Purple Line and the north-south Green Line, which intersect at <StationTooltip station="Majestic">Majestic</StationTooltip>. The Yellow Line connects to the Green Line at <StationTooltip station="RV Road">RV Road</StationTooltip>, adding a second interchange to the city, and connecting <StationTooltip station="Electronic City">Electronic City</StationTooltip> to the rest of the city's metro network. Overlaying the metro network on the city's urban fabric shows how each line connects areas of varying urban growth and use, from the dense central business district, to various secondary business districts, and developing peripheries.

<div class="md:pb-0 pb-8">
  <MetroMap height={isMobile.current ? 400 : 600}/>
</div>

The granularity of the data helps us understand travel patterns in new ways. For example, in the week following the opening of the Yellow Line, only one person travelled from <StationTooltip station="Beratena Agrahara">Beratena Agrahara</StationTooltip> to <StationTooltip station="Mysore Road">Mysore Road</StationTooltip>. That sole trip was made at 5 PM on August 14th, an hour during which over 300 people travelled from <StationTooltip station="Benniganahalli">Benniganahalli</StationTooltip> to <StationTooltip station="Majestic">Majestic</StationTooltip>.

<OneTravelerDemo/>

Which parts of the city have been the most enthusiastic about the Yellow Line? <StationTooltip station="Lalbagh">Lalbagh</StationTooltip> has seen it's average daily ridership increase by nearly 40% since the Yellow Line was opened. On the other hand, a fall in ridership is seen at stations like <StationTooltip station="Chickpete">Chickpete</StationTooltip> and <StationTooltip station="Banashankari">Banashankari</StationTooltip>, popular locations to board BMTC buses bound for <StationTooltip station="Electronic City">Electronic City</StationTooltip> and surrounding areas. Before the Yellow Line, for a person living near <StationTooltip station="Jalahalli">Jalahalli</StationTooltip> and working in <StationTooltip station="Electronic City">Electronic City</StationTooltip>, the metro covered only a minor part of the journey. Now that the Yellow Line has opened, many such commuters can switch to the metro for a majority of the journey. Overall, Purple Line stations saw a minor impact compared to Green Line stations.

<YellowLine/>

On the other hand, when looking at footfall within stations, the impact on <StationTooltip station="RV Road">RV Road</StationTooltip> is immediately noticeable. From previously being one of the lower footfall stations on the network, to now being the sole interchange point between the Yellow Line and the rest of the network, footfall has increased from the earlier 15,000 passengers to now over 75,000 passengers per day. The increase in footfall at <StationTooltip station="Majestic">Majestic</StationTooltip> has been more moderate, from 1.8 lakh to 2.1 lakh passengers per day.

<InterchangeFootfall/>

The week following the opening of the Yellow Line also coincided with multiple events in the city, including Independence Day celebrations and the Lalbagh Flower Show, which brought additional people to stations like <StationTooltip station="Vidhana Soudha">Vidhana Soudha</StationTooltip> and <StationTooltip station="Lalbagh">Lalbagh</StationTooltip>. The largest unusual spike in ridership was observed on August 16th, coinciding with Krishna Janmashtami, which brought many people to ISKCON, near <StationTooltip station="Mahalakshmi">Mahalakshmi</StationTooltip>.

<SpikeGraphic/>

People in the city's peripheries tend to have longer metro commutes, and the opening of the Yellow Line has made the average commute even longer, from 10 stations earlier, to 12 stations after the Yellow Line opened. People at <StationTooltip station="Madavara">Madavara</StationTooltip> have the longest average commute of 18 stations, while people at <StationTooltip station="Halasuru">Halasuru</StationTooltip> have the shortest average commute of 7 stations. In terms of time on the metro each day, a <StationTooltip station="Madavara">Madavara</StationTooltip> commuter spends an average of 73 minutes, while a <StationTooltip station="Halasuru">Halasuru</StationTooltip> commuter spends an average of 27 minutes.

<AverageTripLength/>

Many of the most popular commutes are much shorter, like the 2nd most popular commute, from <StationTooltip station="Sri Sathya Sai Hospital">Sri Sathya Sai Hospital</StationTooltip> to <StationTooltip station="Kadugodi Tree Park">Kadugodi Tree Park</StationTooltip>, a 2 station commute. What is the most popular commute in the entire city? The answer is an indication for what the upcoming Blue Line has in store, as <StationTooltip station="Benniganahalli">Benniganahalli</StationTooltip> to <StationTooltip station="Majestic">Majestic</StationTooltip> is the most popular commute with over 2500 daily commuters.

<Rankings/>

Ever wonder where do most people at a station come from and go to? More people at <StationTooltip station="Nagasandra">Nagasandra</StationTooltip> have commutes involving <StationTooltip station="Sandal Soap Factory">Sandal Soap Factory</StationTooltip> than any other station. At <StationTooltip station="Indiranagar">Indiranagar</StationTooltip>, there are more commutes involving <StationTooltip station="Benniganahalli">Benniganahalli</StationTooltip> than anywhere else. If you want a metro-accessible job near <StationTooltip station="Cubbon Park">Cubbon Park</StationTooltip> or <StationTooltip station="Vidhana Soudha">Vidhana Soudha</StationTooltip>, you might move to <StationTooltip station="Indiranagar">Indiranagar</StationTooltip> or <StationTooltip station="Vijayanagara">Vijayanagara</StationTooltip> to find neighbours who make the same commute.

<TreeMap />

The data also allows for an analysis of shared travel patterns beyond a simple ranking of the busiest routes. Since high-traffic stations naturally have high-traffic connections between them, hidden under the surface are connections that are disproportionately important to each other. This "social connectedness" is found by calculating a score for each route that accounts for the overall ridership of both the origin and destination stations. A high score indicates that the passenger flow between the two stations is significantly higher than the average station, like between <StationTooltip station="Trinity">Trinity</StationTooltip> and <StationTooltip station="Jnanabharathi">Jnanabharathi</StationTooltip>.

<Network/>

Same-line trips are consistently more likely than cross-line trips. The hassle of switching at an interchange means that for most stations, the strongest links are usually to stations on the same line. The few cross-line connections that do rank highly represent notable cross-line travel patterns, many of these being work commutes that disappear over the weekend, such as the commute between <StationTooltip station="Trinity">Trinity</StationTooltip> and <StationTooltip station="JP Nagar">JP Nagar</StationTooltip>. The rhythm of the metro changes in additional ways between weekdays and weekends. Weekdays show two peaks: one at 9 AM as the city gets to work, and one at 6 PM as it heads home. Weekends replace this bimodal rhythm with a single, broad wave of travel that builds from noon through evening.

<DifferenceHourlyRidership/>

The hourly granularity in ridership shows that there are stations whose weekday rhythm doesn't closely match the network-wide weekday rhythm. <StationTooltip station="Chickpete">Chickpete</StationTooltip> has consistently high ridership throughout the day. On weekdays, <StationTooltip station="Majestic">Majestic</StationTooltip> and <StationTooltip station="Yeshwantpur">Yeshwantpur</StationTooltip> wake up the earliest, while Yellow Line stations sleep the latest. On weekends, <StationTooltip station="Yeshwantpur">Yeshwantpur</StationTooltip> is busiest at 9PM.

<HourlyRidershipHeatmap/>

Even the network-wide pattern of weekdays being busier than weekends has its outliers. <StationTooltip station="Pattandur Agrahara">Pattandur Agrahara</StationTooltip>, <StationTooltip station="Trinity">Trinity</StationTooltip> and <StationTooltip station="Indiranagar">Indiranagar</StationTooltip> might be particularly busier on weekdays, but others like <StationTooltip station="Nagasandra">Nagasandra</StationTooltip> and <StationTooltip station="Challaghatta">Challaghatta</StationTooltip> have remarkably consistent patterns between weekdays and weekends. At the other extreme, <StationTooltip station="Chickpete">Chickpete</StationTooltip> and <StationTooltip station="Sandal Soap Factory">Sandal Soap Factory</StationTooltip> are more popular on weekends than on weekdays. <StationTooltip station="Kadugodi Tree Park">Kadugodi Tree Park</StationTooltip> to <StationTooltip station="Sri Sathya Sai Hospital">Sri Sathya Sai Hospital</StationTooltip> is disproportionately popular on weekdays, while <StationTooltip station="Chickpete">Chickpete</StationTooltip> to <StationTooltip station="Majestic">Majestic</StationTooltip> is disproportionately popular on weekends.

<WeekdayWeekendVariation/>

<hr class="w-full !my-12 !border-b !border-netural-300 p-0">

All the above analysis stems from a single dataset. For organizations such as BMRCL, the takeaway should be obvious, which is to release this data regularly. When data is available and covers a long period of time, it can be used to answer a much wider range of questions, more accurately and with greater detail. You can't beat the cost of getting analysis and insights from the public, for free. If you are from BMRCL (or another government agency), please consider releasing data like this regularly.

<h4 class="font-bold pt-8 !m-0">METHODOLOGY</h4>
<hr class="w-full !mt-2 !mb-4 !border-b !border-black p-0">
<small>

The [source data](https://github.com/Vonter/bmrcl-ridership-hourly) was acquired through a Right to Information (RTI) request to [BMRCL](https://english.bmrc.co.in/). It covers the period from August 1st to August 18th, 2025. While this includes a week after the Yellow Line opened, patterns observed from a single week cannot be used to conclusively establish the long-term impact of the line on ridership. Longer periods of data are needed to draw definitive conclusions. The week from 11th August to 18th August also coincides with other events such as Independence Day and the Lalbagh Flower Show, which may have affected ridership patterns in different ways.

The term "ridership" in this analysis refers to the number of people who passed through the fare gates at a station, or a pair of stations. Individuals who go to a station, without entering or exiting the ticketed area of the station by going through the fare gates, do not count towards ridership. As a result, interchange stations like Majestic and RV Road, where many commuters transfer without exiting the ticketed area of the station, may count towards high in-station footfall, but such commuters do not translate to ridership counts in the data.

The data analysis was largely done in R, explore the [analysis notebook](https://diagramchasing.fun/2025/how-bangalore-uses-the-metro/analysis) for more details. Mapping of station names to station locations and additional metadata was done using [spatial data from OpenStreetMap](https://www.openstreetmap.org/relation/13994894#map=11/12.9885/77.5024). Notebook is available under the MIT License.

The frontend was built with SvelteKit, explore the [frontend code](https://github.com/diagram-chasing/blr-metro-ridership/tree/main/src) for more details. The basemap was made using OpenStreetMap data. The landuse map was made using data from [GHS built-up volume (R2023)](https://human-settlement.emergency.copernicus.eu/download.php?ds=builtV). Code is available under the MIT License.

Illustrations of the travellers by [Reechik Bannerjee](https://reechik.com).

Claude AI was used for assistance developing certain interactive components of this project. No text was generated with an LLM.

</small>

<!-- <CrowdDemo /> -->

<PixelScreen/>
