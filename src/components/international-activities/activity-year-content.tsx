"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityExplorer } from "@/components/international-activities/activity-explorer";
import { fetchUploadedActivities } from "@/lib/supabase/activity-documents";
import type { InternationalActivity } from "@/types/international-activity";
import styles from "./activity-year-content.module.css";

export function ActivityYearContent({
  year,
  activities,
}: {
  year: number;
  activities: InternationalActivity[];
}) {
  const [uploadedActivities, setUploadedActivities] = useState<InternationalActivity[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadActivities() {
      try {
        const uploaded = await fetchUploadedActivities();
        if (isCurrent) setUploadedActivities(uploaded);
      } catch (error) {
        console.error("Unable to load user-submitted IR events.", error);
        if (isCurrent) setLoadError(true);
      }
    }

    void loadActivities();
    return () => {
      isCurrent = false;
    };
  }, []);

  const yearActivities = useMemo(() => {
    const curatedKeys = new Set(activities.map((activity) => activity.key));
    const uploadedForYear = uploadedActivities.filter(
      (activity) =>
        activity.dateSort.startsWith(String(year)) && !curatedKeys.has(activity.key),
    );
    return [...activities, ...uploadedForYear];
  }, [activities, uploadedActivities, year]);

  const locations = new Set(yearActivities.map((activity) => activity.location)).size;
  const counterparts = new Set(yearActivities.map((activity) => activity.counterpart)).size;
  const types = new Set(yearActivities.map((activity) => activity.activityType)).size;

  return (
    <>
      <section className="activity-hero" aria-labelledby={`activities-${year}-title`}>
        <div className="container">
          <p className="internal-badge">Strictly for Internal Use</p>
          <p className="page-kicker">INTERNATIONAL ACTIVITIES · COMPLETED YEAR</p>
          <h1 id={`activities-${year}-title`}>{year} International Activities</h1>
          <p>
            TRAI’s documented international engagements, meetings and knowledge-exchange
            activities for {year}.
          </p>
          <div className="activity-stats">
            <Stat number={yearActivities.length} label="Total activities" />
            <Stat number={locations} label="Countries / locations" />
            <Stat number={counterparts} label="International counterparts" />
            <Stat number={types} label="Activity types" />
          </div>
        </div>
      </section>
      <section className="activities-section">
        <div className="container">
          <div className="section-heading">
            <span aria-hidden="true" />
            <h2>Engagement record</h2>
          </div>
          {loadError && (
            <p className={styles.loadWarning} role="status">
              Newly submitted activities could not be loaded. Existing activity records are shown.
            </p>
          )}
          {deleteNotice && <p className={styles.loadWarning} role="status">{deleteNotice}</p>}
          <ActivityExplorer
            activities={yearActivities}
            onDeleteActivity={(id) => {
              setUploadedActivities((current) =>
                current.filter((activity) => activity.key !== id),
              );
              setDeleteNotice("User-submitted activity deleted successfully.");
            }}
          />
        </div>
      </section>
    </>
  );
}

function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div>
      <strong>{number}</strong>
      <span>{label}</span>
    </div>
  );
}
