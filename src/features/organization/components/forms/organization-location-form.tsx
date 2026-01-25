"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganization } from "@/actions/update-organization";

import { toast } from "sonner";

export function OrganizationLocationForm({ organization }: { organization: any }) {
    const [isPending, startTransition] = useTransition();

    const orgDataRaw = organization.organization_data;
    const orgData = Array.isArray(orgDataRaw) ? orgDataRaw[0] : orgDataRaw || {};

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            // Ensure organization ID is maintained implicitly (handled by closure/server) 
            // but here we just pass fields.
            const result = await updateOrganization(organization.id, formData);
            if (result.error) {
                toast.error(`Error: ${result.error}`);
            } else {
                toast.success("Ubicación actualizada correctamente");
            }
        });
    };

    return (
        <form action={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Location</CardTitle>
                    <CardDescription>
                        Manage your organization's physical address and location details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="address">Address Line</Label>
                        <Input
                            type="text"
                            id="address"
                            name="address"
                            defaultValue={orgData.address || ''}
                            placeholder="123 Main St"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="city">City</Label>
                            <Input
                                type="text"
                                id="city"
                                name="city"
                                defaultValue={orgData.city || ''}
                            />
                        </div>
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="state">State / Province</Label>
                            <Input
                                type="text"
                                id="state"
                                name="state"
                                defaultValue={orgData.state || ''}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="postal_code">Postal Code</Label>
                            <Input
                                type="text"
                                id="postal_code"
                                name="postal_code"
                                defaultValue={orgData.postal_code || ''}
                            />
                        </div>
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                type="text"
                                id="country"
                                name="country"
                                defaultValue={orgData.country || ''}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

